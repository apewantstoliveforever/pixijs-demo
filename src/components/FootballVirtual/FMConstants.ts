export const PITCH_WIDTH = 800;
export const PITCH_HEIGHT = 500;
export const GOAL_SIZE = 140; 
export const GOAL_DEPTH = 40; 
export const BALL_COLOR = 0xFFFFFF;

// --- Kích thước Sân ---
export const CENTRE_CIRCLE_RADIUS = 60;
export const PENALTY_AREA_WIDTH = 120; 
export const PENALTY_AREA_HEIGHT = 350;
export const PENALTY_SPOT_DIST = 90; 

// --- Cấu hình Đội ---
export const TEAM_HOME_COLOR = 0xe74c3c; // Đỏ
export const TEAM_AWAY_COLOR = 0x3498db; // Xanh dương

// --- VẬT LÝ ---
export const PLAYER_SPEED = 2.0;       
export const SPRINT_SPEED = 3.2;       
export const BALL_FRICTION = 0.96;     
export const PASS_POWER = 7.0;         
export const SHOOT_POWER = 12.0;       
export const INTERCEPT_RANGE = 20;     

export interface PlayerEntity {
  id: number;
  team: 'HOME' | 'AWAY';
  x: number;
  y: number;
  role: 'GK' | 'DEF' | 'MID' | 'FWD';
  startX: number; 
  startY: number;
  cooldown: number; 
  dribbleSkill: number; // NEW: Điểm kỹ năng rê dắt (0.1 - 1.0)
}