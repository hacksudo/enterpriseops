import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.audit import log_audit_event
from app.models.task import Task, TaskAssignment, TaskComment, TaskEvent, TaskDependency, TaskOccurrence
from app.models.organization import Department, Workspace
from app.models.auth import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskCommentCreate, TaskCommentResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])


def generate_task_number(db: Session) -> str:
    count = db.query(Task).count()
    return f"TASK-{1001 + count}"


@router.get("", response_model=List[TaskResponse])
def list_tasks(
    workspace_id: Optional[str] = None,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to_me: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task).filter(Task.deleted_at == None)
    
    if workspace_id:
        query = query.filter(Task.workspace_id == workspace_id)
    if department_id:
        query = query.filter(Task.department_id == department_id)
    if status:
        query = query.filter(Task.status == status)
    if category:
        query = query.filter(Task.category == category)
    if assigned_to_me:
        query = query.join(TaskAssignment).filter(TaskAssignment.assigned_user_id == current_user.id)
        
    tasks = query.order_by(Task.created_at.desc()).all()
    
    result = []
    for t in tasks:
        assignment = db.query(TaskAssignment).filter(TaskAssignment.task_id == t.id).first()
        assignee_id = assignment.assigned_user_id if assignment else None
        result.append(
            TaskResponse(
                id=t.id,
                organization_id=t.organization_id,
                department_id=t.department_id,
                workspace_id=t.workspace_id,
                project_id=t.project_id,
                task_number=t.task_number,
                title=t.title,
                description=t.description,
                category=t.category,
                priority=t.priority,
                status=t.status,
                created_by=t.created_by,
                assigned_by=t.assigned_by,
                assigned_to=assignee_id,
                due_at=t.due_at,
                started_at=t.started_at,
                completed_at=t.completed_at,
                estimated_minutes=t.estimated_minutes or 0,
                actual_minutes=t.actual_minutes or 0,
                created_at=t.created_at
            )
        )
    return result


@router.post("", response_model=TaskResponse)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = data.organization_id or current_user.organization_id
    dept_id = data.department_id
    if not dept_id:
        dept = db.query(Department).filter(Department.organization_id == org_id).first()
        dept_id = dept.id if dept else None
    ws_id = data.workspace_id
    if not ws_id:
        ws = db.query(Workspace).filter(Workspace.organization_id == org_id).first()
        ws_id = ws.id if ws else None

    task_num = generate_task_number(db)
    new_task = Task(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        department_id=dept_id,
        workspace_id=ws_id,
        project_id=data.project_id,
        task_number=task_num,
        title=data.title,
        description=data.description,
        category=data.category or "Android Penetration Testing",
        priority=data.priority or "medium",
        status="Planned",
        created_by=current_user.id,
        assigned_by=current_user.id if data.assigned_to_user_id else None,
        due_at=data.due_at,
        estimated_minutes=data.estimated_minutes or 0
    )
    db.add(new_task)
    db.flush()

    # Assign task if assigned_to_user_id provided or self-assign
    assigned_user = data.assigned_to_user_id or current_user.id
    assignment = TaskAssignment(
        id=str(uuid.uuid4()),
        task_id=new_task.id,
        assigned_user_id=assigned_user,
        assigned_by=current_user.id,
        assignment_status="assigned"
    )
    db.add(assignment)

    # Event history
    event = TaskEvent(
        id=str(uuid.uuid4()),
        task_id=new_task.id,
        actor_id=current_user.id,
        event_type="created",
        new_values={"status": "Planned", "priority": new_task.priority}
    )
    db.add(event)

    db.commit()
    db.refresh(new_task)

    log_audit_event(
        db,
        action="task_created",
        resource_type="task",
        resource_id=new_task.id,
        actor_id=current_user.id,
        organization_id=new_task.organization_id
    )

    return TaskResponse(
        id=new_task.id,
        organization_id=new_task.organization_id,
        department_id=new_task.department_id,
        workspace_id=new_task.workspace_id,
        project_id=new_task.project_id,
        task_number=new_task.task_number,
        title=new_task.title,
        description=new_task.description,
        category=new_task.category,
        priority=new_task.priority,
        status=new_task.status,
        created_by=new_task.created_by,
        assigned_by=new_task.assigned_by,
        assigned_to=assigned_user,
        due_at=new_task.due_at,
        started_at=new_task.started_at,
        completed_at=new_task.completed_at,
        estimated_minutes=new_task.estimated_minutes or 0,
        actual_minutes=new_task.actual_minutes or 0,
        created_at=new_task.created_at
    )


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id, Task.deleted_at == None).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    prev_status = task.status
    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.category is not None:
        task.category = data.category
    if data.priority is not None:
        task.priority = data.priority
    if data.due_at is not None:
        task.due_at = data.due_at
    if data.actual_minutes is not None:
        task.actual_minutes = data.actual_minutes

    if data.status is not None:
        task.status = data.status
        if data.status == "In Progress" and not task.started_at:
            task.started_at = datetime.datetime.now(datetime.timezone.utc)
        elif data.status in ["Completed", "Approved"] and not task.completed_at:
            task.completed_at = datetime.datetime.now(datetime.timezone.utc)

        # Log event
        event = TaskEvent(
            id=str(uuid.uuid4()),
            task_id=task.id,
            actor_id=current_user.id,
            event_type="status_changed",
            previous_values={"status": prev_status},
            new_values={"status": task.status}
        )
        db.add(event)

    db.commit()
    db.refresh(task)

    assignment = db.query(TaskAssignment).filter(TaskAssignment.task_id == task.id).first()
    assignee_id = assignment.assigned_user_id if assignment else None

    return TaskResponse(
        id=task.id,
        organization_id=task.organization_id,
        department_id=task.department_id,
        workspace_id=task.workspace_id,
        project_id=task.project_id,
        task_number=task.task_number,
        title=task.title,
        description=task.description,
        category=task.category,
        priority=task.priority,
        status=task.status,
        created_by=task.created_by,
        assigned_by=task.assigned_by,
        assigned_to=assignee_id,
        due_at=task.due_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
        estimated_minutes=task.estimated_minutes or 0,
        actual_minutes=task.actual_minutes or 0,
        created_at=task.created_at
    )


@router.post("/{task_id}/comments", response_model=TaskCommentResponse)
def add_task_comment(
    task_id: str,
    data: TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comment = TaskComment(
        id=str(uuid.uuid4()),
        task_id=task.id,
        user_id=current_user.id,
        content=data.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/clear-all")
def clear_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permanently deletes all tasks, assignments, comments, dependencies, and events.
    Cleans the task board completely for client handover or fresh launch.
    """
    count = db.query(Task).count()
    db.query(TaskDependency).delete(synchronize_session=False)
    db.query(TaskOccurrence).delete(synchronize_session=False)
    db.query(TaskComment).delete(synchronize_session=False)
    db.query(TaskAssignment).delete(synchronize_session=False)
    db.query(TaskEvent).delete(synchronize_session=False)
    db.query(Task).delete(synchronize_session=False)
    db.commit()

    log_audit_event(
        db,
        action="all_tasks_cleared",
        resource_type="task",
        resource_id="all",
        actor_id=current_user.id,
        organization_id=current_user.organization_id,
        event_metadata={"deleted_count": count}
    )

    return {
        "status": "success",
        "message": f"Successfully deleted all {count} tasks. Task board is 100% clean!",
        "deleted_count": count
    }


@router.delete("/{task_id}")
def delete_single_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permanently deletes a single task and all its dependencies, comments, and events.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task_number = task.task_number
    task_title = task.title

    db.query(TaskDependency).filter(
        (TaskDependency.task_id == task_id) | (TaskDependency.depends_on_task_id == task_id)
    ).delete(synchronize_session=False)
    db.query(TaskOccurrence).filter(TaskOccurrence.task_id == task_id).delete(synchronize_session=False)
    db.query(TaskComment).filter(TaskComment.task_id == task_id).delete(synchronize_session=False)
    db.query(TaskAssignment).filter(TaskAssignment.task_id == task_id).delete(synchronize_session=False)
    db.query(TaskEvent).filter(TaskEvent.task_id == task_id).delete(synchronize_session=False)
    db.delete(task)
    db.commit()

    log_audit_event(
        db,
        action="task_deleted",
        resource_type="task",
        resource_id=task_id,
        actor_id=current_user.id,
        organization_id=task.organization_id,
        event_metadata={"task_number": task_number, "title": task_title}
    )

    return {
        "status": "success",
        "message": f"Task {task_number} ('{task_title}') deleted successfully",
        "task_id": task_id
    }
