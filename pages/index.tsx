import { SEO } from 'components'
import type { NextPage } from 'next'
import Link from 'next/link'
import Script from 'next/script'

interface State {}

const HomePage: NextPage = () => {
  return (
    <>
      <SEO />
      <article className="prose prose-neutral p-4 dark:prose-invert">
        <h2>안녕하세요! 커디입니다.</h2>
        <p>
          커디는 <strong>개발자 채팅방</strong>입니다.
        </p>

        <p>커디는 다음과 같은 목적으로 만들어졌습니다.</p>
        <ul>
          <li>
            개발자들끼리 자유롭게 웹 상에서 <strong>실시간</strong> 소통하는
            공간을 만들고자
          </li>
          <li>
            코드 관련 질문들을 <strong>코드 블록</strong>을 첨부해서 할 수
            있도록
          </li>
          <li>업무 중에 심심하면 와서 떠들 수 있는 장소</li>
        </ul>
        <p>앞으로 다음과 같은 서비스로 만들어 보고자 합니다.</p>
        <ul>
          <li>커리어 관리에 플러스 요소가 되어줄 수 있는 곳</li>
          <li>개발자들끼리 서로 돕고 사는 생태계</li>
          <li>
            같은 개발자이지만 서로 다른 분야에서 일하는 개발자들과의 네트워킹
            공간
          </li>
        </ul>
        <p>
          커디는 오픈 소스입니다.{' '}
          <a target="_blank" href="https://github.com/kidow/coddee">
            Github
          </a>
          에서 코드를 보실 수 있습니다.
        </p>
        <p>
          문의 혹은 개선사항이 있다면 서비스 내 채팅이나 "의견 보내기" 버튼을
          통해 보내주세요.
        </p>
        <p>커디에 오신 여러분을 환영합니다.</p>
        <p className="text-xs italic text-neutral-400">
          (Coddee는 Coffee와 Code의 합성어입니다.)
        </p>
      </article>
      <div className="mt-4 flex gap-2 px-4 text-sm text-neutral-400">
        <Link href="/terms">
          <a>이용약관</a>
        </Link>
        <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
        <Link href="/privacy">
          <a>개인정보처리방침</a>
        </Link>
        <div className="w-px bg-neutral-200 dark:bg-neutral-700" />
        <Link href="/release">
          <a>업데이트 내역</a>
        </Link>
      </div>
      <div className="mt-4 px-4">
        <a
          className="github-button"
          href="https://github.com/kidow/coddee"
          data-color-scheme="no-preference: light; light: light; dark: light;"
          data-size="large"
          data-show-count="true"
          aria-label="Star kidow/coddee on GitHub"
        >
          Star
        </a>
      </div>
      <Script src="https://buttons.github.io/buttons.js" async defer />
    </>
  )
}

export default HomePage
