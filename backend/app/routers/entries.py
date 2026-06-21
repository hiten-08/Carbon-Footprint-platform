"""
Entry routes.

Every query is scoped to `current_user.id` so one user can never read or
mutate another user's data -- there is no "trust the client-supplied
user_id" path anywhere in this file. Delete and update both 404 (not 403)
on a foreign entry id, so the API doesn't even confirm the row exists.
"""
import datetime as dt
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.orm import User, Entry
from app.schemas.schemas import EntryCreate, EntryOut
from app.services.emission_factors import get_factor

router = APIRouter(prefix="/api/entries", tags=["entries"])


def _to_entry_out(entry: Entry) -> EntryOut:
    factor = get_factor(entry.activity)
    return EntryOut(
        id=entry.id,
        category=entry.category,
        activity=entry.activity,
        activity_label=factor.label,
        quantity=entry.quantity,
        unit=entry.unit,
        co2e_kg=entry.co2e_kg,
        note=entry.note,
        logged_for_date=entry.logged_for_date.date(),
        created_at=entry.created_at,
    )


@router.post("", response_model=EntryOut, status_code=status.HTTP_201_CREATED)
def create_entry(
    payload: EntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    factor = get_factor(payload.activity)  # KeyError impossible: validated in schema
    co2e = round(factor.kg_co2e_per_unit * payload.quantity, 3)

    entry = Entry(
        user_id=current_user.id,
        category=factor.category,
        activity=payload.activity,
        quantity=payload.quantity,
        unit=factor.unit,
        co2e_kg=co2e,
        note=payload.note,
        logged_for_date=dt.datetime.combine(payload.logged_for_date, dt.time.min),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _to_entry_out(entry)


@router.get("", response_model=List[EntryOut])
def list_entries(
    start_date: Optional[dt.date] = Query(default=None),
    end_date: Optional[dt.date] = Query(default=None),
    category: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Entry).filter(Entry.user_id == current_user.id)
    if start_date:
        q = q.filter(Entry.logged_for_date >= dt.datetime.combine(start_date, dt.time.min))
    if end_date:
        q = q.filter(Entry.logged_for_date <= dt.datetime.combine(end_date, dt.time.max))
    if category:
        q = q.filter(Entry.category == category)
    entries = q.order_by(Entry.logged_for_date.desc(), Entry.created_at.desc()).all()
    return [_to_entry_out(e) for e in entries]


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(Entry)
        .filter(Entry.id == entry_id, Entry.user_id == current_user.id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return None
