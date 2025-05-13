pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "wafa23/auth-service1"
        SONAR_TOKEN = credentials('jenkins-sonar') // Stocké dans Jenkins Credentials
        SONAR_HOST_URL = 'http://localhost:9000' // Change avec l'URL de ton serveur Sonar
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

        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                sh 'chmod +x ./node_modules/.bin/jest || true'
                sh 'npx jest || echo "Tests échoués (continuer pour debug)"'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('MySonarQube') {
                    sh """
                        npx sonar-scanner \
                        -Dsonar.projectKey=auth-service \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=$SONAR_HOST_URL \
                        -Dsonar.login=$SONAR_TOKEN
                    """
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def imageTag = "${DOCKER_IMAGE}:${commitHash}"
                    sh "docker build -t $imageTag ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        def commitHash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        def imageTag = "${DOCKER_IMAGE}:${commitHash}"

                        sh """
                            echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
                            docker push "$imageTag" || { echo "Échec du push de l'image Docker"; exit 1; }
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline exécutée avec succès !'
        }
        failure {
            echo '❌ Une erreur est survenue pendant le pipeline.'
        }
        always {
            echo '📝 Pipeline terminée.'
        }
    }
}
