# DNS pipeline 
This project is following the Medium post about how to manage your DNS via CDK pipelines

### Before getting started
- Make sure to have all accounts bootstrapped with your latest CDK version _(**this project is using the CDK v2**)_
    - when bootstrapping make sure to add the `--trust <pipeline-account-id>` parameter and trust the pipeline account to deploy CFN stacks into the application account
- Make sure to replace the `connection`-string and the git repo in the `lib/pipeline/pipeline.ts`
- Make sure to replace the account-ids in `lib/constants/accounts.ts`

### Rolling out the pipeline
1. Make sure to have credentials to your pipeline account in your current terminal session
2. run `cdk diff` and verify successfull synthesis and check the output
3. run `cdk deploy`
4. add all your changes, and push to your git repo
