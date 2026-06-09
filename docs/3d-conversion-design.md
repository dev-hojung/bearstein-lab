# Bearstein Lab — 전체 3D 전환 설계 (Full-3D Conversion Design)

> 목표: 2D 픽셀아트 종이인형 앱을 **진짜 3D 경험**으로 전환한다.
> 전략: 누적(additive) 진화 — 이미 출시한 2.5D 위에 화면별로 3D를 쌓고,
> 한 단계 실패가 다음을 막지 않도록 **2D 폴백을 상시 유지**한다.
> 핵심 원칙: 모든 단계가 **공통 소켓/렌더러 추상화**를 공유한다. 다음 단계는
> 재작성이 아니라 "렌더러 한 조각 + 에셋 한 벌" 교체로 끝난다.

문서 상태: 2026-06 / 브랜치 `feat/3d-assembly-default` 기준.

---

## A. 현재 구현 상태 (As-Built) — 무엇이 이미 됐나

조립 화면(s4)은 **이미 3D가 기본**이다. 나머지 화면(s1/s2/s3)은 아직 2D 픽셀아트다.

| 영역 | 파일 | 상태 |
|---|---|---|
| 소켓 좌표계 | `src/lib/scene-3d.ts` | ✅ `socketForPart(part)` — 2D와 **동일 소스**(`assemblyPosFor`/`assemblyZFor`)로 앵커 해석. v2 5슬롯(ears/eyes/ghost/hands/shoes) 분리 배치 |
| WebGL PNG 저장 | `src/lib/capture-3d.ts` | ✅ `preserveDrawingBuffer` + `toDataURL`, 3x 투명 PNG (`html-to-image` 대체) |
| 상태 모델 | `src/lib/store.ts` | ✅ `partRotations` 추가, persist v2→v3. position/scale은 2D와 공유 |
| 3D 조립 씬 | `src/components/screens/AssemblyScene3D.tsx` | ✅ R3F 2.5D — SVG 텍스처 평면, 포인터 틸트, 시차 깊이, ContactShadows, 부위별 이동/크기/Y회전 |
| 진입/폴백 | `src/app/page.tsx` | ✅ **s4 기본=3D**, `?exp=2d`면 2D `AssemblyScreen` 폴백. dynamic import `ssr:false` |
| 렌더러 추상화 | `AssemblyScene3D` 내 `PartNode` | ✅ `sprite \| billboard3d \| mesh` 분기 — 현재 **sprite만 구현**, 나머지는 폴백 |

검증: `next build`(tsc) 통과, Playwright e2e로 3D 기본 진입·5슬롯 배치·회전/크기·744KB PNG·2D 폴백·콘솔 에러 0 확인.

> ⚠️ 직전 설계 문서 대비 갱신점: (1) 진입이 `?exp=3d` 플래그 → **3D 기본 + `?exp=2d` 폴백**으로 변경.
> (2) 정적 `SOCKETS[cat]` → **`socketForPart()`**(v2 슬롯 인지)로 변경.

**여기까지가 "2.5D"** — 평면 SVG를 3D 공간에 띄운 것. 아래부터가 "전체 3D"의 설계다.

---

## B. "전체 3D"의 정의 — 화면별 스코프

앱은 4개 화면. 각 화면을 3D로 만든다는 것의 의미와 비용이 다르다.

| 화면 | 현재 | 전체 3D 목표 | 에셋 비용 |
|---|---|---|---|
| s1 인트로 | `intro.webp` + CRT/글리치 | 3D 로고/연구실 입구 리빌, 카메라 도입 | 소~중 |
| s2 랩 씬 | 합성 이미지 + 5 히트존(`SHELF_ZONES`) | **둘러보는 3D 연구실**, 선반=3D 오브젝트 | **대** (룸 모델링) |
| s3 부품 셸프 | 캐비닛 이미지 + 5×3 타일 그리드 | **3D 캐비닛**, 부품=회전하는 3D 미니어처 | 대 (부품 메시) |
| s4 조립 | ✅ 2.5D (구현됨) | **진짜 3D 곰** 360° + 소켓 결합 + 기즈모 | **대** (곰 파츠 메시) |

핵심 통찰: **진짜 병목은 코드가 아니라 3D 에셋 제작**이다. 곰 파츠 메시와 연구실 룸이
전체 일정의 70~80%. 코드(R3F)는 표준이라 상대적으로 예측 가능.

**스코프 권고 (2트랙 분리):**
- **트랙 1 — 곰(파츠) 진짜 3D**: s4(+s3 미리보기)의 곰을 GLTF 메시로. 제품 가치 핵심.
- **트랙 2 — 환경(룸/캐비닛) 3D**: s1/s2/s3의 무대를 3D 공간으로. 분위기·몰입.
두 트랙은 독립 진행 가능. **트랙 1 먼저**를 권장(로드맵 F).

---

## C. 공통 아키텍처 (모든 3D 화면이 공유)

### C.1 단일 3D 월드 vs 화면별 씬
- **선택: 화면별 R3F `<Canvas>`(현 방식 유지) + 공유 라이브러리.**
  단일 영속 월드(전환 시 카메라만 이동)는 몰입↑이나 화면 간 강결합·메모리·복잡도↑.
  현 전환은 `AnimatePresence`+`url-section` 기반이라 화면별 Canvas가 기존 구조와 정합.
  공통 요소(곰 rig·조명·카메라·postprocessing)는 `src/lib/r3f/`로 추출해 재사용.

### C.2 곰 Rig & 소켓 (트랙 1의 심장) — 현 `socketForPart` 확장
지금 소켓은 2D 평면 좌표(top/width/depth) 환산. 진짜 3D에선 **부착 변환 + 명명 규약**으로 승격:
```ts
// scene-3d.ts (확장)
export type Socket3D = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  anchor?: 'pivot' | 'top' | 'center'; // 메시 원점 규약과 1:1
};
export const BEAR_SOCKETS: Record<V2Slot, Socket3D>; // ears/eyes/ghost/hands/shoes
```
이 소켓 맵은 **2.5D·하이브리드·진짜 3D 내내 불변**. 메시든 스프라이트든 여기 붙는다.

### C.3 파츠 렌더러 추상화 (이미 존재, 확장만)
`PartNode`의 `sprite | billboard3d | mesh` 분기:
- `sprite`(P1, 구현됨): SVG 텍스처 평면
- `billboard3d`(P2): 깊이·음영 + SVG `ExtrudeGeometry` 얇은 입체(브리지)
- `mesh`(P3): `useGLTF`로 진짜 메시 부착
**파츠 단위 점진 승격**: `part.model`(glb url) 있으면 mesh, 없으면 빌보드 폴백 →
일부만 메시인 혼합 카탈로그로 출시 가능.

### C.4 데이터 모델 (하위호환 추가)
```ts
// parts-data.ts — Part에 옵션 필드
type Part = { /* 기존 */ model?: string; colorway?: string; socket?: V2Slot };
```
- `model` 없으면 현행 SVG 빌보드. 점진 마이그레이션 스위치.
- **색상 4종(mint/rose/sky/기본)은 별도 파일 금지** → 단일 메시 + 머티리얼/버텍스컬러
  스왑. 현 64개 SVG 변형(16×4색)을 메시에선 **16 메시 + 색 파라미터**로 축소.

### C.5 공통 R3F 라이브러리 `src/lib/r3f/`
- `Lighting.tsx` — 파스텔/CRT 무드 3점+환경광 프리셋
- `CameraRig.tsx` — 화면별 OrbitControls 제한값 프리셋
- `Effects.tsx` — bloom/비네팅/스캔라인 postprocessing(현 CSS 오버레이의 3D판)
- `useCaptureBridge` — `capture-3d` 래퍼
- `MeshPart.tsx` / `SpritePart.tsx` — 렌더러 구현 분리

### C.6 저장/캡처
`capture-3d`(구현됨) 공통 사용. 진짜 3D에선 "현재 앵글 PNG"가 자연스럽고, 선택적으로
**턴테이블 GIF/짧은 회전 영상** 내보내기 확장 가능(P3 옵션).

---

## D. 에셋 파이프라인 (실제 작업의 70~80%) — 트랙 1

### D.1 곰 파츠 모델 사양 (모델러/AI 생성기 전달용 스펙)
- **수량**: v2 슬롯 5종 × 변형(현 데이터 부위별 4변형). 우선 **슬롯당 1개(총 5개) PoC**, 이후 확장.
- **포맷**: glb, Draco 압축. 모바일 합산 폴리 예산(G) 내.
- **원점/스케일 규약**: 모델 원점 = 소켓 부착점, +Y 업, 1 unit = `PX_TO_UNIT` 정합.
  ears/eyes는 머리 위 같은 기준 프레임 공유(현 `ASM_POS_V2` top −8/18 관계의 3D판).
- **색상**: 베이스 머티리얼 1개 + tint 슬롯. 텍스처 1 set 또는 무텍스처 vertex color.
- **명명**: `bear_<slot>_<variant>.glb`, 소켓 노드명 규약 문서화.

### D.2 조달 방식 (결정 필요 — D.4)
- (a) 전문 모델러: 품질 최상, 비용·일정 큼
- (b) **AI 3D 생성(Meshy / Tripo / Rodin)**: 기존 SVG/이미지 레퍼런스로 베이스 메시 생성 →
  리토폴로지/정리. 빠르고 저렴, 품질·소켓 정렬은 손봐야 함. **PoC 권장**
- (c) 절차적(프리미티브 조합 곰): 에셋 0이나 표현 한계

### D.3 파이프라인 단계
1. 슬롯당 1개 베이스 메시 확보(방식 b로 빠르게) → 2. 원점/스케일/소켓 정렬 정리(Blender) →
3. Draco glb 익스포트 → `public/models/` → 4. `part.model` 채우고 mesh 분기 활성 →
5. 모바일 실측 → 폴리/텍스처 예산 튜닝 → 변형 확장.

### D.4 결정 필요 (트랙 1 진입 전)
1. **모델 조달 방식**: (a)/(b)/(c)? → 권장 (b)로 5개 PoC 후 판단
2. **색상 전략**: 머티리얼 스왑(권장) vs 텍스처 변형
3. **PoC 범위**: 5슬롯 전체 vs "1슬롯(ears/eyes)만" 먼저

---

## E. 화면별 3D 설계

### E.1 s4 조립 (트랙 1 — 곰)
현 2.5D → **하이브리드(P2) → 진짜 3D(P3)**:
- **P2 하이브리드**: `Lighting`/소프트섀도/`Effects` 도입, 빌보드 깊이·음영, SVG 압출.
  카메라 무대 틸트 → `OrbitControls` 제한 궤도로 이관. (렌더러 분기 1줄 + 노드 추가)
- **P3 진짜 3D**: `part.model` 채우고 mesh 분기 활성. 3축 트랜스폼 기즈모(현 패널 확장),
  풀 오빗, 결합 스냅(소켓에 끼우는 느낌), 색상 = 머티리얼 파라미터.

### E.2 s3 부품 셸프 (트랙 1 미리보기 + 트랙 2 캐비닛)
- 현재: 캐비닛 이미지 + 5×3 SVG 타일.
- 트랙 1: 타일을 **회전하는 3D 미니어처**(소형 캔버스 or 인스턴스)로. hover 회전.
- 트랙 2: 캐비닛 자체를 3D 오브젝트로(룸과 통합).
- `CABINET_SHELF_ZONES`·카테고리 전환·`addOrReplace` 카트 로직은 그대로 재사용.

### E.3 s2 랩 씬 (트랙 2 — 환경, 최대 에셋)
- 현재: `lab-bright`/`lab-dark` 합성 + 5 `SHELF_ZONES` + "lights out" 연출.
- 목표: **둘러보는 3D 연구실**, 선반 5개가 3D 오브젝트, 카메라 패럴랙스/제한 오빗.
  "lights out"은 3D 조명 시퀀스로 재현.
- 비용 큼(룸 모델링). **트랙 1 완료 후** 착수. 폴백: 현 2D 이미지 유지.

### E.4 s1 인트로 (가벼운 3D 입구)
- 3D 로고/연구실 문 열림 → 카메라 진입 → s2. 또는 현 글리치 인트로 유지 후 3D 디졸브.
  비용 소~중, 마지막에 해도 됨.

---

## F. 로드맵 & 마일스톤

| 단계 | 내용 | 트랙 | 산출물 | 의존 |
|---|---|---|---|---|
| ✅ M0 | 2.5D 기반 + s4 3D 기본 | 1 | (완료) | — |
| M1 | 공통 `r3f/` 라이브러리 추출(조명·카메라·effects·캡처) | 1 | 재사용 레이어 | M0 |
| M2 | s4 하이브리드(P2): 조명/그림자/압출/오빗 | 1 | 입체 무대 | M1 |
| M3 | **곰 메시 PoC** — 1슬롯 glb → mesh 분기 검증(소켓 정렬·모바일 성능) | 1 | go/no-go 근거 | M1, D.4 |
| M4 | 곰 5슬롯 메시 + 색상 머티리얼 + 기즈모 + 결합 스냅 | 1 | **진짜 3D 곰** | M3 |
| M5 | s3 부품 3D 미니어처 미리보기 | 1 | 셸프 입체화 | M4 |
| M6 | s2 3D 연구실 룸 | 2 | 몰입 환경 | M4(독립 가능) |
| M7 | s1 3D 인트로 + 화면 간 카메라 연결 다듬기 | 2 | 마감 | M6 |

권장: **M1→M2→M3 먼저**. M3 PoC 결과로 전체 모델링/룸 발주 규모 확정 후 M4~ 진행.

---

## G. 리스크 & 가드레일

- **모바일 WebGL 성능/배터리**: 폴리·드로우콜·텍스처 예산을 M3에서 실측. 합산 목표
  예산을 정하고 LOD/인스턴싱 검토. 저사양은 자동 2D 폴백.
- **번들 크기**: three+R3F+drei(+postprocessing) 증가. dynamic import로 3D 청크 분리(적용됨).
- **에셋 일관성**: 소켓 원점/스케일 규약 위반이 최대 함정 → 규약 문서 + glb 검증 스크립트.
- **접근성/폴백**: WebGL 미지원·`prefers-reduced-motion`·저사양 → 2D 경로 상시 유지
  (현 `?exp=2d`를 정식 폴백 정책으로 승격).
- **무드 보존**: 파스텔/CRT 감성을 3D 조명·postprocessing으로 재현(흰 PBR 룩 회피).
- **단계 격리**: 각 마일스톤 독립 출시 가능, 실패가 다음을 막지 않음.

---

## H. 지금 결정해 주실 것 (다음 작업 착수용)

1. **트랙 우선순위**: 트랙 1(곰 진짜 3D) 먼저 vs 트랙 2(환경) 병행? → 권장 **트랙 1 먼저**
2. **에셋 조달**(D.4-1): AI 생성(b) PoC vs 모델러(a)?
3. **PoC 범위**(D.4-3): 1슬롯 vs 5슬롯?
4. 다음 코드 작업: **M1(공통 r3f 추출)** vs **M2(하이브리드)** 중 무엇부터?
