import { SEO } from 'components'
import type { NextPage } from 'next'
import Link from 'next/link'

interface State {}

const HomePage: NextPage = () => {
  return (
    <>
      <SEO />
      <article className="prose prose-neutral p-4 text-neutral-500">
        <h2>안녕하세요! 커디입니다.</h2>
        <p>
          커디는 <strong>개발자 채팅방</strong>입니다.
        </p>

        <p>커디는 다음과 같은 목적으로 만들어졌습니다.</p>
        <ul>
          <li>
            개발자들끼리 자유롭게 <strong>웹 상에서</strong> 소통하는 공간을
            만들고자
          </li>
          <li>
            코딩 관련 질문들을 <strong>코드</strong>를 첨부해서 할 수 있도록
          </li>
          <li>업무 중에 심심하면 와서 떠들 수 있는 장소</li>
        </ul>
        <p>앞으로 다음과 같은 서비스로 만들어 보고자 합니다.</p>
        <ul>
          <li>커리어 관리에 플러스 요소가 되어줄 수 있는 곳</li>
          <li>개발자들끼리 서로 돕고 사는 생태계</li>
        </ul>
        <p>
          문의 혹은 개선사항이 있다면 서비스 내 채팅이나 "의견 보내기" 버튼을
          통해 보내주세요.
        </p>
        <p>커디에 오신 여러분을 환영합니다.</p>
      </article>
      <div className="mt-4 flex gap-2 px-4 text-sm text-neutral-400">
        <Link href="/terms">
          <a>이용약관</a>
        </Link>
        <div className="w-px bg-neutral-200" />
        <Link href="/privacy">
          <a>개인정보처리방침</a>
        </Link>
      </div>
    </>
  )
}

export default HomePage
