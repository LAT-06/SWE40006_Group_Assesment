pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {

        // ── 1. INSTALL DEPENDENCIES ───────────────────────────────────────────
        stage('Install') {
            parallel {
                stage('Frontend') {
                    steps { dir('frontend') { sh 'npm ci' } }
                }
                stage('Backend') {
                    steps { dir('backend') { sh 'npm ci' } }
                }
            }
        }

        // ── 2. CODE SCAN & TESTS ──────────────────────────────────────────────
        stage('Code Scan') {
            parallel {
                stage('Frontend: Type Check') {
                    steps { dir('frontend') { sh 'npm run type-check' } }
                }
                stage('Frontend: Security Audit') {
                    steps { dir('frontend') { sh 'npm audit --audit-level=high --omit=dev || true' } }
                }
                stage('Backend: Type Check') {
                    steps { dir('backend') { sh 'npm run type-check' } }
                }
                stage('Backend: Unit Tests') {
                    steps { dir('backend') { sh 'npm run test:coverage' } }
                }
                stage('Backend: Security Audit') {
                    steps { dir('backend') { sh 'npm audit --audit-level=high --omit=dev || true' } }
                }
            }
        }

        // ── 3. SONARQUBE ANALYSIS ─────────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'sonar-scanner'
                }
            }
        }

        // ── 4. QUALITY GATE ───────────────────────────────────────────────────
        // Blocks pipeline if code quality fails the defined threshold
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ── 5. BUILD & PACKAGE BACKEND ────────────────────────────────────────
        // Prepare lambda zip payload before infrastructure provisioning
        stage('Build & Package Backend') {
            when { 
                anyOf { branch 'main'; branch 'lat' } 
            }
            steps {
                dir('backend') {
                    sh '''
                        npm run build
                        rm -rf lambda_pkg
                        mkdir -p lambda_pkg
                        cp -r dist/ lambda_pkg/dist
                        cp package.json lambda_pkg/
                        
                        cd lambda_pkg && npm install --omit=dev --ignore-scripts && cd ..
                        mkdir -p ../terraform
                        zip -r ../terraform/backend.zip lambda_pkg/
                        rm -rf lambda_pkg
                    '''
                }
            }
        }

        // ── 6. TERRAFORM PROVISION (INFRA & BACKEND DEPLOY) ───────────────────
        // Provision AWS resources and extract dynamic outputs for frontend build
        stage('Terraform Provision') {
            when { 
                anyOf { branch 'main'; branch 'lat' } 
            }
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'tf-state-bucket',       variable: 'TF_STATE_BUCKET'),
                    string(credentialsId: 'vite-supabase-url',     variable: 'TF_VAR_supabase_url'),
                    string(credentialsId: 'vite-supabase-anon-key',variable: 'TF_VAR_supabase_anon_key')
                ]) {
                    dir('terraform') {
                        sh '''
                            export AWS_DEFAULT_REGION=ap-southeast-2
                            
                            terraform init \
                                -backend-config="bucket=$TF_STATE_BUCKET" \
                                -backend-config="region=ap-southeast-2"

                            terraform apply -auto-approve
                        '''
                        // Extract dynamic variables to Jenkins environment
                        script {
                            env.API_URL            = sh(script: 'terraform output -raw api_url', returnStdout: true).trim()
                            env.CLOUDFRONT_DOMAIN  = sh(script: 'terraform output -raw cloudfront_domain', returnStdout: true).trim()
                            env.CLOUDFRONT_ID      = sh(script: 'terraform output -raw cloudfront_distribution_id', returnStdout: true).trim()
                            env.S3_FRONTEND_BUCKET = sh(script: 'terraform output -raw frontend_bucket', returnStdout: true).trim()
                        }
                    }
                }
            }
        }

        // ── 7. BUILD FRONTEND ─────────────────────────────────────────────────
        // Build Vue/Vite app injecting the dynamically generated API_URL
        stage('Build Frontend') {
            when { 
                anyOf { branch 'main'; branch 'lat' } 
            }
            steps {
                withCredentials([
                    string(credentialsId: 'vite-supabase-url',      variable: 'VITE_SUPABASE_URL'),
                    string(credentialsId: 'vite-supabase-anon-key', variable: 'VITE_SUPABASE_ANON_KEY')
                ]) {
                    dir('frontend') {
                        sh '''
                            VITE_API_URL=${API_URL} \
                            VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
                            VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
                            npm run build-only
                        '''
                    }
                }
            }
        }

        // ── 8. DEPLOY FRONTEND ────────────────────────────────────────────────
        // Push static assets to S3 and invalidate CloudFront cache
        stage('Deploy Frontend') {
            when { 
                anyOf { branch 'main'; branch 'lat' } 
            }
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        export AWS_DEFAULT_REGION=ap-southeast-2

                        aws s3 sync frontend/dist/assets s3://${S3_FRONTEND_BUCKET}/assets \
                            --cache-control "public, max-age=31536000, immutable" \
                            --delete

                        aws s3 sync frontend/dist s3://${S3_FRONTEND_BUCKET} \
                            --exclude "assets/*" \
                            --cache-control "no-cache, no-store, must-revalidate" \
                            --delete

                        aws cloudfront create-invalidation \
                            --distribution-id ${CLOUDFRONT_ID} \
                            --paths "/*"
                    '''
                }
            }
        }
    }

    post {
        always  { cleanWs() }
        failure { echo 'Pipeline FAILED — Check stage logs.' }
        success { echo 'Pipeline PASSED — Application deployed successfully.' }
    }
}