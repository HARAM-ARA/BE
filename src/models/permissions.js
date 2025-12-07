/**
 * 팀 권한 비트 플래그
 * 0-7 범위의 숫자로 여러 권한을 한 번에 관리
 *
 * 비트 구조 (3비트):
 * - 비트 0 (값 1): SWAP - 크레딧 교환 권한
 * - 비트 1 (값 2): STEAL - 크레딧 뺏기 권한
 * - 비트 2 (값 4): ANGER - 하은이의 분노 (선택한 팀 초기화)
 *
 * 예시:
 * - 0 (000): 권한 없음
 * - 1 (001): SWAP만
 * - 2 (010): STEAL만
 * - 3 (011): SWAP + STEAL
 * - 4 (100): ANGER만
 * - 5 (101): SWAP + ANGER
 * - 6 (110): STEAL + ANGER
 * - 7 (111): 모든 권한
 */
export const PERMISSION = {
  NONE: 0,    // 000 - 권한 없음
  SWAP: 1,    // 001 - 크레딧 교환
  STEAL: 2,   // 010 - 크레딧 뺏기
  ANGER: 4,   // 100 - 하은이의 분노 (선택한 팀 초기화)
};

/**
 * 권한 확인
 * @param {number} flags - 현재 권한 플래그
 * @param {number} permission - 확인할 권한 비트
 * @returns {boolean}
 */
export function hasPermission(flags, permission) {
  return (flags & permission) !== 0;
}

/**
 * 권한 부여
 * @param {number} flags - 현재 권한 플래그
 * @param {number} permission - 부여할 권한 비트
 * @returns {number} 새로운 권한 플래그
 */
export function grantPermission(flags, permission) {
  return flags | permission;
}

/**
 * 권한 제거
 * @param {number} flags - 현재 권한 플래그
 * @param {number} permission - 제거할 권한 비트
 * @returns {number} 새로운 권한 플래그
 */
export function revokePermission(flags, permission) {
  return flags & ~permission;
}
