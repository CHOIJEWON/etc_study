import got, { TimeoutError } from "got";

// gotInstance 생성
const gotInstance = got.extend({
  timeout: {
    connect: 3000, // 3초 (커넥트 타임아웃)
    response: 5000, // 5초 (리드 타임아웃)
  },
  retry: {
    calculateDelay: ({ attemptCount, error }) => {
      // 최대 시도 횟수 초과 시 0을 반환
      if (attemptCount >= 3) {
        console.log("최대 시도 횟수에 도달했습니다.");
        return 0; // 더 이상 재시도하지 않음
      }

      // 커넥트 타임아웃일 경우 재시도 않음
      if (error instanceof TimeoutError && error.message.includes("connect")) {
        console.log(`커넥트 타임아웃 재시도 중: ${attemptCount}번째 시도`);
        return 1000;
      }

      // 리드 타임아웃일 경우 재시도하지 않음
      if (error instanceof TimeoutError && error.message.includes("response")) {
        console.log(
          `리드 타임 아웃이 발생하였습니다 재시도를 시도하지 않습니다.`
        );
        console.log(`해당 타임 아웃에서 로그를 생성합니다.`);
        return 0; // 1초 후 재시도
      }

      // 기타 오류는 재시도하지 않음
      return 0;
    },
  },
});

const CONNECT_TIMEOUT_URL = "http://example.com:81";
const READ_TIMEOUT_URL = "http://httpbin.org/delay/5";

// 타임아웃 테스트 함수
async function testTimeout(type) {
  const requestUrl =
    type === "connect" ? CONNECT_TIMEOUT_URL : READ_TIMEOUT_URL;

  try {
    console.log(`요청 성공: ${type} timeout 테스트`);
    return await gotInstance.get(requestUrl);
  } catch (error) {
    if (error instanceof TimeoutError) {
      if (error.message.includes("connect")) {
        console.error("커넥트 타임아웃 발생: 서버에 연결할 수 없습니다.");
      } else if (error.message.includes("response")) {
        console.error("리드 타임아웃 발생: 응답 시간이 초과되었습니다.");
      } else {
        console.error("타임아웃 오류 발생:", error.message);
      }
    } else {
      console.error("기타 오류 발생:", error.message);
    }
  }
}

// 테스트 실행
const readTimeout = await testTimeout("read");
/**
    $ node main.js
    요청 성공: read timeout 테스트
    리드 타임 아웃이 발생하였습니다 재시도를 시도하지 않습니다.
    해당 타임 아웃에서 로그를 생성합니다.
    리드 타임아웃 발생: 응답 시간이 초과되었습니다.
    � ~ readTimeout: undefined
 */
console.log("🚀 ~ readTimeout:", readTimeout);

const connectTimout = await testTimeout("connect");
/**
    $ node main.js  (요청 결과)
    요청 성공: connect timeout 테스트
    커넥트 타임아웃 재시도 중: 1번째 시도
    커넥트 타임아웃 재시도 중: 2번째 시도
    최대 시도 횟수에 도달했습니다.
    커넥트 타임아웃 발생: 서버에 연결할 수 없습니다.
    � ~ connectTimoue: undefined
 */
console.log("🚀 ~ connectTimout:", connectTimout);
