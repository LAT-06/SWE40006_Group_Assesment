pipeline {
    agent any

    options {
        // Discard old builds; keep last 10
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Fail the build if it runs longer than 20 minutes
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {

        // ── 1. INSTALL ─────────────────────────────────────────────────────────
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

        // ── 2. CODE SCAN ───────────────────────────────────────────────────────
        //    Runs on every branch and every PR.
        //    All sub-stages run in parallel; any failure blocks the pipeline.
        stage('Code Scan') {
            parallel {

                stage('Frontend: Type Check') {
                    steps {
                        // vue-tsc --build — catches TypeScript errors across all .vue files
                        dir('frontend') { sh 'npm run type-check' }
                    }
                }

                stage('Frontend: Security Audit') {
                    steps {
                        // Fail if any HIGH or CRITICAL vulnerability is found
                        dir('frontend') {
                            sh 'npm audit --audit-level=high --omit=dev || true'
                        }
                    }
                }

                stage('Backend: Type Check') {
                    steps {
                        // tsc --noEmit — strict TypeScript check, no output files
                        dir('backend') { sh 'npm run type-check' }
                    }
                }

                stage('Backend: Unit Tests') {
                    steps {
                        // vitest in single-run (non-watch) mode
                        dir('backend') { sh 'npm test -- --run' }
                    }
                }

                stage('Backend: Security Audit') {
                    steps {
                        dir('backend') {
                            sh 'npm audit --audit-level=high --omit=dev || true'
                        }
                    }
                }

            }
        }

        // ── 3. BUILD ───────────────────────────────────────────────────────────
        //    Build artefacts needed for deployment.
        stage('Build') {
            parallel {

                stage('Frontend: Vite Build') {
                    when { branch 'main' }
                    steps {
                        withCredentials([
                            string(credentialsId: 'vite-supabase-url',      variable: 'VITE_SUPABASE_URL'),
                            string(credentialsId: 'vite-supabase-anon-key', variable: 'VITE_SUPABASE_ANON_KEY'),
                            string(credentialsId: 'vite-api-url',           variable: 'VITE_API_URL')
                        ]) {
                            // build-only skips the redundant type-check (already done in Scan)
                            dir('frontend') { sh 'npm run build-only' }
                        }
                    }
                }

                stage('Backend: tsc Build') {
                    when { branch 'main' }
                    steps {
                        // Compile TypeScript → dist/  (used by Package stage)
                        dir('backend') { sh 'npm run build' }
                    }
                }

            }
        }

        // ── 4. PACKAGE LAMBDA ─────────────────────────────────────────────────
        stage('Package Lambda') {
            when { branch 'main' }
            steps {
                dir('backend') {
                    sh '''
                        rm -rf lambda_pkg
                        mkdir -p lambda_pkg
                        cp -r dist/   lambda_pkg/dist
                        cp package.json lambda_pkg/
                        # Install production-only deps inside the package folder
                        cd lambda_pkg && npm install --omit=dev --ignore-scripts && cd ..
                        # Zip everything into terraform/ so Terraform can upload it to S3
                        zip -r ../terraform/backend.zip lambda_pkg/
                        rm -rf lambda_pkg
                    '''
                }
            }
        }

        // ── 5. DEPLOY FRONTEND → S3 + CloudFront ──────────────────────────────
        stage('Deploy Frontend') {
            when { branch 'main' }
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',          variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',       variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 's3-bucket',                   variable: 'S3_BUCKET'),
                    string(credentialsId: 'cloudfront-distribution-id',  variable: 'CLOUDFRONT_DISTRIBUTION_ID')
                ]) {
                    sh '''
                        export AWS_DEFAULT_REGION=ap-southeast-2

                        # Content-hashed assets → 1-year immutable cache
                        aws s3 sync frontend/dist/assets s3://$S3_BUCKET/assets \
                            --cache-control "public, max-age=31536000, immutable" \
                            --delete

                        # index.html + other HTML → always fresh (no cache)
                        aws s3 sync frontend/dist s3://$S3_BUCKET \
                            --exclude "assets/*" \
                            --cache-control "no-cache, no-store, must-revalidate" \
                            --delete

                        # Bust CloudFront edge caches so users get the new version
                        aws cloudfront create-invalidation \
                            --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
                            --paths "/*"
                    '''
                }
            }
        }

        // ── 6. DEPLOY BACKEND → Lambda via Terraform ──────────────────────────
        stage('Deploy Backend') {
            when { branch 'main' }
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',    variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'tf-state-bucket',       variable: 'TF_STATE_BUCKET'),
                    string(credentialsId: 'supabase-url',          variable: 'TF_VAR_supabase_url'),
                    string(credentialsId: 'supabase-anon-key',     variable: 'TF_VAR_supabase_anon_key'),
                    string(credentialsId: 'cloudfront-domain',     variable: 'CLOUDFRONT_DOMAIN')
                ]) {
                    dir('terraform') {
                        sh '''
                            export AWS_DEFAULT_REGION=ap-southeast-2
                            export TF_VAR_allowed_origins="https://$CLOUDFRONT_DOMAIN"

                            terraform init \
                                -backend-config="bucket=$TF_STATE_BUCKET" \
                                -backend-config="region=ap-southeast-2"

                            terraform apply -auto-approve
                        '''
                    }
                }
            }
        }

    }

    post {
        always  { cleanWs() }
        failure { echo 'Pipeline FAILED — check stage logs above.' }
        success { echo 'Pipeline passed — app is live on AWS.' }
    }
}
