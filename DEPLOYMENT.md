# 원형 시간표 서비스 배포 안내

원형 시간표 서비스의 개발이 완료되었습니다! 이제 웹에 배포하여 누구나 접속할 수 있도록 만들 차례입니다.

이 작업은 현재 사용 중인 Firebase 환경에 맞춰 **Firebase Hosting**을 통해 진행하는 것이 가장 간단합니다.

## 배포 방법

이곳의 터미널에서 아래의 명령어들을 순서대로 실행해 주세요.

### 1. Firebase 로그인

가장 먼저 Firebase에 로그인해야 합니다. 아래 명령어를 실행하면 브라우저 창이 열리며 Google 계정으로 로그인할 수 있습니다.

```bash
firebase login
```

### 2. Firebase 프로젝트 초기화

다음으로 로컬 프로젝트를 Firebase와 연결합니다. 아래 명령어를 실행하세요.

```bash
firebase init hosting
```

명령어를 실행하면 몇 가지 질문이 나옵니다. 아래와 같이 답변해 주세요.

*   **? Please select an option:** `Use an existing project` (기존 Firebase 프로젝트에 연결)
*   **? Select a default Firebase project for this directory:** 목록에서 이 웹사이트를 배포할 Firebase 프로젝트를 선택하세요. (만약 프로젝트가 없다면 `Create a new project`를 선택하여 새로 만들 수 있습니다.)
*   **? What do you want to use as your public directory?** `.` (현재 디렉토리를 의미합니다)
*   **? Configure as a single-page app (rewrite all urls to /index.html)?** `Yes`
*   **? Set up automatic builds and deploys with GitHub?** `No` (지금은 수동으로 배포합니다)

위 과정을 마치면 `firebase.json`과 `.firebaserc` 파일이 생성되어 Firebase 배포 설정이 완료됩니다.

### 3. Firebase에 배포하기

이제 마지막 단계입니다. 아래 명령어를 실행하면 프로젝트가 빌드되고 Firebase 서버에 업로드됩니다.

```bash
firebase deploy
```

배포가 성공적으로 완료되면 터미널에 **"Hosting URL"**이 표시됩니다. 이 주소가 바로 전 세계 어디서든 접속할 수 있는 당신의 웹사이트 주소입니다.

---

## Git 배포에 대하여

프로젝트의 모든 코드와 Firebase 설정 파일(`firebase.json`, `.firebaserc`)은 이제 Git으로 버전 관리가 되고 있습니다.

- **GitHub 연동 (선택 사항):**
  1. GitHub에서 새로운 리포지토리를 생성합니다.
  2. 터미널에서 아래 명령어를 실행하여 로컬 리포지토리를 GitHub와 연결하고 코드를 푸시합니다.
     ```bash
     git remote add origin <GitHub 리포지토리 주소>
     git branch -M main
     git push -u origin main
     ```
  이렇게 하면 코드가 GitHub에 안전하게 백업되며, 다른 사람과 협업하거나 다른 환경에서 프로젝트를 이어갈 수 있습니다.

이것으로 '원형 시간표' 웹 서비스의 제작 및 배포가 모두 완료되었습니다!