import { SEO } from 'components'
import type { NextPage } from 'next'

interface State {}

const ReleasePage: NextPage = () => {
  return (
    <>
      <SEO title="업데이트 내역" />
      <article className="prose prose-neutral p-4 dark:prose-invert">
        <h2>업데이트 내역</h2>
        <h3>2023년 1월</h3>
        <ul>
          <li>1월 18일</li>
          <ul>
            <li>
              다크 모드에서 새로고침 시 배경색이 깜빡이는 문제를 개선했습니다.
            </li>
          </ul>
        </ul>
        <h3>2022년 12월</h3>
        <ul>
          <li>12월 22일</li>
          <ul>
            <li>깃허브 contributions를 프로필 모달에 추가했습니다.</li>
          </ul>
          <li>12월 18일</li>
          <ul>
            <li>
              비로그인 상태에서 온라인 유저 목록이 안보이는 현상을 개선했습니다.
            </li>
          </ul>
          <li>12월 14일</li>
          <ul>
            <li>
              코드 에디터를 열 시 현재 위치한 채팅방에 해당하는 언어를 기본
              설정할 수 있도록 했습니다.
            </li>
          </ul>
          <li>12월 13일</li>
          <ul>
            <li>
              채팅 데이터를 불러오는 로직을 수정, 리렌더링을 방지하여 성능을
              개선했습니다.
            </li>
          </ul>
          <li>12월 12일</li>
          <ul>
            <li>
              페이지를 이동할 때마다 코드에디터의 언어 목록을 계속 호출하는
              문제를 수정했습니다.
            </li>
            <li>채팅을 입력할 때 빈 문자열에 대한 검증 로직을 개선했습니다.</li>
            <li>깃허브에 라이센스 파일을 추가했습니다.</li>
            <li>
              타인이 채팅 입력 시에 뜨는 문구가 입력창의 위치를 계속 바꾸는
              불편함을 개선했습니다.
            </li>
            <li>
              다크모드에서 저장한 메시지의 배경색이 어색한 점을 개선했습니다.
            </li>
            <li>Toast 모달에 X 아이콘을 추가하여 가시성을 개선했습니다.</li>
            <li>현재 온라인 유저의 너비를 3배로 늘렸습니다.</li>
          </ul>
          <li>12월 10일</li>
          <ul>
            <li>컴포넌트들의 리렌더링 로직을 점검하여 속도를 개선했습니다.</li>
          </ul>
          <li>12월 6일</li>
          <ul>
            <li>통합검색 기능을 추가했습니다.</li>
          </ul>
          <li>12월 2일</li>
          <ul>
            <li>Vue, Svelte 언어를 추가했습니다.</li>
            <li>
              채팅방은 최신 채팅순으로 나열하고, 새 채팅이 생긴 방을 최상단으로
              올리도록 했습니다.
            </li>
          </ul>
        </ul>
        <h3>2022년 11월</h3>
        <ul>
          <li>11월 30일</li>
          <ul>
            <li>이모지가 클릭되지 않는 버그를 개선했습니다.</li>
          </ul>
          <li>11월 24일</li>
          <ul>
            <li>이모지가 윈도우 환경에서 깨지는 현상을 개선했습니다.</li>
          </ul>
          <li>11월 22일</li>
          <ul>
            <li>코드 열고 닫기 기능을 다시 없앴습니다.</li>
            <li>코드는 2,000자 이하로 입력 가능하도록 변경했습니다.</li>
            <li>
              타이핑 시 자동으로 텍스트에어리어에 포커싱되도록 개선했습니다.
            </li>
          </ul>
          <li>11월 21일</li>
          <ul>
            <li>맨션 기능이 다소 미흡했던 점을 개선했습니다.</li>
            <li>텍스트 입력시 이모지 선택이 가능하도록 기능이 추가했습니다.</li>
            <li>
              텍스트의 링크 자동 매핑이 제대로 동작하지 않는 문제를
              개선했습니다.
            </li>
          </ul>
          <li>11월 18일</li>
          <ul>
            <li>
              채팅 입력 시 URL 오픈그래프 데이터가 생성되지 않던 문제를
              개선했습니다.
            </li>
          </ul>
          <li>11월 16일</li>
          <ul>
            <li>
              채팅방과 스레드에서 다른 유저가 타이핑 중일 시 타 유저가
              실시간으로 알 수 있도록 메시지를 추가했습니다.
            </li>
            <li>툴팁의 UI가 깨지는 현상을 개선했습니다.</li>
          </ul>
          <li>11월 14일</li>
          <ul>
            <li>
              현재 온라인, 로그인, 탭에 위치한 유저를 오른쪽 상단에 표시하는
              기능을 추가했습니다.
            </li>
          </ul>
          <li>11월 13일</li>
          <ul>
            <li>
              채팅방에서 내 상호작용(채팅, 리액션, 답장 등)이 딜레이가 생기는
              현상을 개선했습니다.
            </li>
          </ul>
          <li>11월 8일</li>
          <ul>
            <li>
              코드블록에 대해 멘션으로 답장할 수 있는 기능을 추가했습니다.
            </li>
          </ul>
          <li>11월 5일</li>
          <ul>
            <li>Spinner 아이콘을 변경했습니다.</li>
            <li>스레드의 답장도 코드블록을 추가할 수 있도록 했습니다.</li>
            <li>코드블록을 열고 닫을 수 있는 기능을 추가했습니다.</li>
            <li>404 페이지를 추가했습니다.</li>
            <li>저장된 메시지는 채팅방에서 아이콘으로 표시하도록 했습니다.</li>
            <li>
              코드 에디터에서 언어 선택 시 템플릿 코드를 적용하도록 했습니다.
            </li>
            <li>테마 변경 시 코드블록은 변경되지 않던 문제를 해결했습니다.</li>
          </ul>
          <li>11월 4일</li>
          <ul>
            <li>메시지 저장 기능과 페이지를 추가했습니다.</li>
          </ul>
          <li>11월 3일</li>
          <ul>
            <li>채팅에서 email은 자동으로 링크로 마스킹하도록 했습니다.</li>
            <li>
              채팅에서 URL은 오픈그래프 데이터를 긁어올 수 있도록 기능을
              추가했습니다.
            </li>
            <li>채팅 삭제 기능을 추가했습니다.</li>
          </ul>
          <li>11월 1일</li>
          <ul>
            <li>인증 로직을 개선했습니다.</li>
          </ul>
        </ul>
        <h3>2022년 10월</h3>
        <ul>
          <li>10월 31일</li>
          <ul>
            <li>멘션 기능을 추가했습니다. ☺️</li>
            <li>
              나에게 멘션이 올 때 웹으로 푸시 알림이 올 수 있도록 내 설정에
              추가했습니다.
            </li>
          </ul>
          <li>10월 30일</li>
          <ul>
            <li>프로필 모달에 스켈레톤을 추가했습니다.</li>
            <li>채팅에서 URL을 자동으로 링크로 마스킹하도록 했습니다.</li>
          </ul>
          <li>10월 27일</li>
          <ul>
            <li>새 이용약관 및 개인정보처리방침을 추가했습니다.</li>
            <li>
              내 리액션은 강조 처리하고, 'ㅇㅇㅇ님 외 n명'으로 표시하도록
              변경했습니다.
            </li>
            <li>툴팁의 UI를 개선했습니다.</li>
            <li>도배를 3초 안에 3번 이상 할 수 없도록 적용했습니다.</li>
          </ul>
          <li>10월 26일</li>
          <ul>
            <li>답장 및 스레드 기능을 출시했습니다. 😀</li>
          </ul>
          <li>10월 24일</li>
          <ul>
            <li>이모지 리액션을 추가했습니다. 😄</li>
          </ul>
          <li>10월 21일</li>
          <ul>
            <li>코드블록에서 스크롤이 적용되지 않는 현상을 해결했습니다.</li>
            <li>내 채팅을 수정할 수 있도록 했습니다.</li>
          </ul>
          <li>10월 20일</li>
          <ul>
            <li>유저 프로필을 Github API를 활용해서 보도록 변경했습니다.</li>
            <li>
              유저 프로필에 팔로잉 수, 팔로워 수, 저장소 수를 추가했습니다.
            </li>
            <li>채팅방 추가, 수정, 삭제 시 실시간 알림을 띄우도록 했습니다.</li>
            <li>내 활동 히스토리를 볼 수 있는 타임라인을 추가했습니다.</li>
          </ul>
          <li>10월 19일</li>
          <ul>
            <li>다크 모드를 추가했습니다.</li>
          </ul>
          <li>10월 18일</li>
          <ul>
            <li>첫 버전을 출시했습니다. 🚀</li>
          </ul>
        </ul>
      </article>
    </>
  )
}

export default ReleasePage
