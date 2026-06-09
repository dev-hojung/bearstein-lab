# Bearstein Lab — 3D 전환 점진적 진화 설계

> 목표: 2D 종이인형 조립 앱을 **진짜 3D 곰 빌더**로 발전시킨다.
> 전략: ① 의사 3D(2.5D) → ② 하이브리드 → ③ 진짜 3D 모델 을 **누적(additive)** 으로 쌓는다.
> 핵심 원칙: 세 단계가 **동일한 소켓 좌표계 + 파츠 렌더러 추상화**를 공유한다.
> 다음 단계는 재작성이 아니라 "렌더러 한 조각 + 데이터 한 필드" 교체로 끝난다.

상태(2026-06): Next 16 / React 19 / zustand / framer-motion. 3D 라이브러리 없음.
파츠는 평면 SVG 64장(4부위 × 4변형 × 4색상). 조립은 `AssemblyScreen`에서 2D 레이어링.
저장은 `html-to-image`(DOM→PNG). 피처 플래그 패턴(`?exp=v2`) 기존 존재.

---

## 0. 공통 기반 (Phase 0 — 세 단계가 전부 의존)

이 레이어를 처음에 제대로 깔아두는 것이 점진적 진화의 전제다.

### 0.1 라이브러리
- `@react-three/fiber` (R3F v9, React 19 호환), `@react-three/drei`, `three`.
- `'use client'` + `dynamic(() => import(...), { ssr: false })` 로 로드 (WebGL은 SSR 불가).
- **선행: `node_modules/next/dist/docs/` 의 dynamic import / client component 가이드 확인** (AGENTS.md 규칙).

### 0.2 소켓 좌표계 — `ASM_POS`(2D top/z)를 3D로 대체/병행
`src/lib/scene-3d.ts`
```ts
export type Socket = {
  position: [number, number, number]; // 3D 앵커 (부위별 부착 지점)
  rotation: [number, number, number];
  scale: number;
};
// head/body/arm/leg 4개 소켓. 기존 ASM_Z 적층 순서를 z축 깊이로 환산.
export const SOCKETS: Record<Category, Socket> = { /* ... */ };
```
이 소켓은 **세 단계 내내 불변**. 파츠가 sprite든 mesh든 항상 이 소켓에 붙는다.

### 0.3 파츠 렌더러 추상화 — 진화의 심장
```ts
type PartVisual =
  | { kind: 'sprite'; texture: string }              // Phase 1: SVG 텍스처 평면
  | { kind: 'billboard3d'; texture: string; depth: number } // Phase 2: 깊이/그림자
  | { kind: 'mesh'; glbUrl: string };                // Phase 3: 진짜 메시
```
`<PartNode socket part transform />` 가 `part.render?.kind`(없으면 현 phase 기본값)에 따라
렌더러를 분기. **파츠를 3D로 승격 = glb 추가 + kind를 'mesh'로 바꾸는 것뿐.** 씬 코드는 그대로.
→ 카탈로그를 파츠 단위로 점진 마이그레이션 가능(일부는 mesh, 일부는 sprite 공존).

### 0.4 상태 모델 확장 (하위호환)
`store.ts` 에 3축 트랜스폼 추가, 기존 2D 필드는 유지하고 마이그레이션:
```ts
partTransforms: Record<string, {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}>;
```
`onRehydrateStorage`에서 구버전 `partOffsets{x,y}`/`partScales` → `partTransforms`로 1회 변환.

### 0.5 PNG 저장 — `html-to-image` 불가, 공통 유틸로 교체
WebGL 캔버스는 DOM 캡처가 안 됨.
- `gl` 옵션에 `preserveDrawingBuffer: true`
- 저장 시 고해상도 오프스크린 렌더 → `renderer.domElement.toDataURL('image/png')` (현 pixelRatio 3 대응).
- 투명 배경 유지를 위해 배경 plane을 캡처 직전 토글.
`src/lib/capture-3d.ts` 로 분리 — 세 단계 공통.

### 0.6 진입 & 폴백
- 기존 `?exp=v2` 와 동일하게 **`?exp=3d`** 플래그 뒤에서 `AssemblyScene3D` 활성화.
- 2D `AssemblyScreen`은 그대로 유지 → 항상 폴백/대조군 존재. WebGL 미지원·저사양 기기 자동 폴백.

---

## Phase 1 — 의사 3D (2.5D) 🟢 에셋 추가 0장

**목표:** 기존 SVG 64장을 그대로 쓰면서 "입체로 보이게". 가장 빠른 출시 가능 산출물.

- 각 SVG를 텍스처 평면(`<mesh>` + plane geometry, alpha test)으로 로드해 소켓에 배치.
  (SVG→texture: `TextureLoader` 또는 svg를 캔버스 래스터화. 색상변형은 기존 파일 재사용.)
- 깊이감 장치:
  - 부위별 z 오프셋(머리 앞 / 다리 뒤) — 기존 `ASM_Z` 그대로 환산.
  - 무대 전체를 마우스/자이로에 따라 ±10° tilt + parallax.
  - `<ContactShadows>` 로 바닥 그림자 → 떠 있지 않고 "놓인" 느낌.
  - CRT/파스텔 무드 유지: 약한 bloom/비네팅 postprocessing(선택).
- 조작 UX: 현 드래그=이동 그대로 유지(스크린 평면 이동을 소켓 오프셋으로 매핑). 회전은 아직 무대 한정.
- 저장: 0.5 공통 유틸.

**산출물:** 돌아가는 3D 무대 위 종이인형. 기존 기능(선택/이동/스케일/저장) 전부 동등.
**공수:** 소 (수일). 리스크 낮음 — 신규 에셋 없음.

---

## Phase 2 — 하이브리드 🟡 무대는 진짜 3D, 파츠는 빌보드

**목표:** 조명·그림자·회전이 진짜인 디오라마. 파츠는 아직 2D지만 입체 공간에 산다.

- 조명 리그: 3점 조명 + 환경광(`<Environment>`), 소프트 섀도(`<AccumulativeShadows>`).
- 파츠 렌더러를 `billboard3d`로 승격: 카메라를 향하되 약간의 두께/노멀 음영(emissive tint).
- **브리지 기법:** SVG path를 `ExtrudeGeometry`로 살짝 압출 → 평면이 아닌 얇은 입체. 진짜 메시(P3) 전 단계 질감.
- 카메라: `OrbitControls` 가동 범위 확대(상하/좌우 제한 궤도). 무대 회전 → 카메라 궤도로 이관.
- 색상변형: 이 시점부터 텍스처 tint를 머티리얼로 처리 시도 → 64파일 의존 축소 준비.

**Phase 1에서 바뀌는 것:** 렌더러 분기 한 줄(`sprite`→`billboard3d`) + 조명/그림자 노드 추가. 데이터·소켓·저장 그대로.
**공수:** 중.

---

## Phase 3 — 진짜 3D 모델 🔴 파츠 = GLTF 메시

**목표:** 360° 곰을 돌려보고 파츠를 소켓에 끼우는 진짜 3D 빌더. **에셋 제작이 전체 일정의 80%.**

### 3.1 데이터 (하위호환 추가)
`parts-data.ts` 의 `Part`에 옵션 필드 추가 — 있으면 mesh, 없으면 빌보드 폴백:
```ts
type Part = { /* 기존 */ model?: string; /* /models/h0.glb */ };
```
→ **파츠별 점진 교체**: 머리만 먼저 메시화하고 나머지는 빌보드로 두는 혼합 출시 가능.

### 3.2 에셋 파이프라인 (핵심 의사결정 — 아래 "결정 필요" 참조)
- 모델 수: 최소 16개(4부위×4변형). **색상 4종은 별도 파일 금지** → 단일 메시 + 머티리얼/버텍스컬러 스왑(64→16).
- 포맷: GLB, Draco 압축. 모바일 폴리 예산 합산 관리.
- **소켓 정렬 규약:** 모든 메시는 원점 = 부착 지점, +Y 업, 동일 스케일 기준. (모델러/생성기에 전달할 스펙 문서화.)

### 3.3 코드
- `useGLTF`(drei)로 로드 + Suspense, Draco loader 설정.
- `PartNode` 의 `mesh` 분기: 메시를 소켓 트랜스폼에 부착.
- 트랜스폼 기즈모: 3축 이동/회전/스케일(`TransformControls` 또는 커스텀). 모바일은 현 FAB 패드를 3축으로 확장.
- 카메라 풀 오빗.

**Phase 2에서 바뀌는 것:** 렌더러에 `mesh` 분기 추가 + `model` 필드 채우기 + 기즈모 확장. 소켓/저장/플래그 그대로.
**공수:** 대 (코드는 표준, **모델링 리소스가 병목**).

---

## 진화 매트릭스 — 단계별로 "무엇만" 바뀌나

| 레이어 | P1 (2.5D) | P2 (하이브리드) | P3 (진짜 3D) |
|---|---|---|---|
| 소켓 좌표계 (0.2) | ✅ 확정 | 그대로 | 그대로 |
| 상태 모델 (0.4) | ✅ 확정 | 그대로 | 그대로 |
| 저장 유틸 (0.5) | ✅ 확정 | 그대로 | 그대로 |
| 진입 플래그 (0.6) | ✅ 확정 | 그대로 | 그대로 |
| 파츠 렌더러 | sprite | +billboard3d | +mesh |
| 조명/그림자 | ContactShadows | 3점+환경+소프트 | 그대로 |
| 카메라 | 무대 tilt | OrbitControls | 풀 오빗 |
| 에셋 | SVG 재사용 | SVG 압출 | **GLB 신규** |

→ 0번 기반(소켓/상태/저장/플래그)을 한 번만 깔면, 이후는 **렌더러 + 에셋만** 진화.

---

## 결정 필요 (Phase 3 진입 전, 미리 합의해두면 좋음)

1. **3D 모델 조달 방식**
   - (a) 전문 모델러 외주/내부 — 품질 최상, 비용·일정 큼
   - (b) AI 3D 생성(Meshy / Tripo / Rodin 등)으로 베이스 → 정리 — 빠름·저렴, 품질/리깅 손봐야 함
   - (c) 절차적/프리미티브 조합으로 곰 형태 코드 생성 — 에셋 0이지만 표현 한계
2. **색상변형 전략:** 머티리얼 스왑(권장) vs 텍스처 배리언트 — 64→16 파일 축소 여부.
3. **PoC 범위:** P1 전체 vs "머리 1개만 진짜 메시"로 P3 리스크 먼저 검증.

---

## 권장 진행 순서

1. **Phase 0 기반 + Phase 1 PoC**를 `?exp=3d` 뒤에 구현 → 돌아가는 2.5D 무대 확보(빠른 가치).
2. 무드/성능/UX 검증 후 **Phase 2**로 조명·그림자·압출 입체화.
3. 병행하여 **모델 1개(머리)**만 P3 파이프라인으로 만들어 메시 경로·소켓 정렬·번들/모바일 성능을 실측 → 전체 모델링 발주 결정.
4. 모델 확보분부터 파츠 단위로 `mesh` 승격(혼합 출시).

리스크 요약: 모바일 WebGL 성능/배터리, R3F 번들 증가, SVG→텍스처 선명도(P1), 메시 소켓 정렬 일관성(P3), 저장 해상도/투명도.
모두 단계별로 격리되어 한 단계 실패가 다음 단계를 막지 않음(2D 폴백 상시 유지).
