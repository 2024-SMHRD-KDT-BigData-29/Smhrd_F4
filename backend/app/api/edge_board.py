# app/api/edge_board.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# 실제 프로젝트 구조에 맞게 import 경로 수정
from app.db.database import get_db
from app.model.edge_board_model import EdgeBoard
from app.schema.edge_board_schema import EdgeBoardCreate, EdgeBoardUpdate, EdgeBoardResponse

# 인증/인가 로직이 있다면 주석 해제 및 사용
# from ..core.security import get_current_active_user
# from ..model.user_model import User as UserModel

router = APIRouter(prefix="/api/edge-boards", tags=["EdgeBoard"])


# --- READ ALL (GET) ---
@router.get("/", response_model=List[EdgeBoardResponse])
async def read_all_edge_boards(
        skip: int = 0,
        limit: int = 100,  # 기본값을 더 작게 설정하거나, 최대 limit을 강제할 수 있습니다.
        db: Session = Depends(get_db)
        # current_user: UserModel = Depends(get_current_active_user)
):
    db_edge_boards = db.query(EdgeBoard).order_by(EdgeBoard.eb_idx).offset(skip).limit(limit).all()
    return db_edge_boards



# --- UPDATE (PUT) ---
@router.put("/{eb_idx}", response_model=EdgeBoardResponse)
async def update_edge_board(
        eb_idx: int,
        edge_board_data: EdgeBoardUpdate,  # 요청 본문은 EdgeBoardUpdate 스키마 사용
        db: Session = Depends(get_db)
        # current_user: UserModel = Depends(get_current_active_user)
):
    db_edge_board = db.query(EdgeBoard).filter(EdgeBoard.eb_idx == eb_idx).first()
    if db_edge_board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EdgeBoard not found")

    update_data = edge_board_data.model_dump(exclude_unset=True)  # 값이 제공된 필드만 업데이트
    for key, value in update_data.items():
        setattr(db_edge_board, key, value)

    db.commit()
    db.refresh(db_edge_board)
    return db_edge_board


# --- DELETE (DELETE) ---
@router.delete("/{eb_idx}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_edge_board(
        eb_idx: int,
        db: Session = Depends(get_db)
        # current_user: UserModel = Depends(get_current_active_user)
):
    # React 코드에서 eb_idx 1번 삭제 방지 로직을 넣었지만, 백엔드에서도 필수적으로 검증해야 합니다.
    if eb_idx == 1:  # 이 ID가 정말로 삭제되면 안 되는 핵심 장비 ID인지 확인 필요
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Core device (eb_idx: 1) cannot be deleted."
        )

    db_edge_board = db.query(EdgeBoard).filter(EdgeBoard.eb_idx == eb_idx).first()
    if db_edge_board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EdgeBoard not found")

    db.delete(db_edge_board)
    db.commit()
    # 204 No Content 응답이므로 return 문이 없습니다.

# 디버깅용
    def __repr__(self):
        return f"<EdgeBoard(eb_idx={self.eb_idx}, eb_name='{self.eb_name}')>"