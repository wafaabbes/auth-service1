pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "wafa23/auth-service1"
        SONAR_TOKEN = credentials('jenkins-sonar')               // ID des credentials Sonar dans Jenkins
        SONAR_HOST_URL = 'http://localhost:9000'                 // URL du serveur SonarQube
    }

    options {
        skipStagesAfterUnstable()
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/wafaabbes/auth-service1.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'    // Plus rapide et plus sûr que 'npm install' en CI
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    try {
                        sh 'npx jest --ci'
                    } catch (Exception e) {
                        echo "⚠️ Tests échoués, continuer le pipeline pour debug."
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('MySonarQube') {                 // 'MySonarQube' doit être le nom du serveur configuré dans Jenkins
                    sh """
                        npx sonar-scanner \
                          -Dsonar.projectKey=auth-service \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONAR_HOST_URL} \
                          -Dsonar.login=${SONAR_TOKEN} \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    """
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def imageTag = "${DOCKER_IMAGE}:${commitHash}"
                    sh "docker build -t ${imageTag} ."
                    env.IMAGE_TAG = imageTag
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
                        docker push "${IMAGE_TAG}"
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline exécutée avec succès !'
        }
        failure {
            echo '❌ Échec de l’exécution du pipeline.'
        }
        always {
            echo '📝 Fin du pipeline.'
        }
    }
}
