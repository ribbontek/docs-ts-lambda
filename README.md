# Documents TypeScript Lambda

This repo is an example on the Serverless Framework for a blog series found at [Ribbontek](https://ribbontek.com/)

## Initial Setup Instructions

This project has been generated using the `aws-nodejs-typescript` template from
the [Serverless framework](https://www.serverless.com/).

For detailed instructions, please refer to the [documentation](https://www.serverless.com/framework/docs/providers/aws/)

* Install serverless package globally   
  `npm install -g serverless`

* Initialize a new serverless project   
  `serverless create --template aws-nodejs-typescript --path docs-ts-lambda`

* Install yarn package manager globally (OPTIONAL) 
  `npm install yarn -g`   
NOTE: this project uses npm to install the node packages

## Get the project up & running

Installation: 
- Run `npm install` to install the project dependencies
- Run `sls dynamodb install` to install SLS DynamoDB (THIS ONE IS REQUIRED)

Run Commands
- Run `npm run start` to run the stack locally (Requires DynamoDB)
- Run `sls offline start` to run the stack locally (Requires DynamoDB)

## Commands for checking DynamoDB Local

- POSTS TABLE >>   
Run `aws dynamodb scan --table-name ribbontek_posts_test --endpoint-url http://localhost:8002 --region ap-southeast-2` to verify an item was created locally   
Run `aws dynamodb describe-table --table-name ribbontek_posts_test --endpoint-url http://localhost:8002` to verify the table creation locally   

- FILES TABLE >>    
Run `aws dynamodb scan --table-name ribbontek_files_test --endpoint-url http://localhost:8002 --region ap-southeast-2` to verify an item was created locally    
Run `aws dynamodb describe-table --table-name ribbontek_files_test --endpoint-url http://localhost:8002` to verify the table creation locally   

- USERS TABLE >>   
Run `aws dynamodb scan --table-name ribbontek_users_test --endpoint-url http://localhost:8002 --region ap-southeast-2` to verify an item was created locally   
Run `aws dynamodb describe-table --table-name ribbontek_users_test --endpoint-url http://localhost:8002` to verify the table creation locally   

- Expressions
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html#Expressions.OperatorsAndFunctions.Syntax

## Test your lambdas

- Run `yarn test` to run all tests (this will automatically spin up an environment with serverless)

Note: Requires AWS Keys locally that have permissions for AWS Cognito & Textract

- Run `yarn pretest && yarn pm2 logs` to set up the stack locally 
- Run `yarn pm2kill` to kill the stack locally
- Run the desired test using jest through your IDE

Occasionally a crashing lambda will cause DynamoDB to try to restart when it's already running. Kill the process running on port 8002 

## Deploy your lambdas

Set up your prod vars in the .env file (Cognito) 

- Run `npm run deploy` OR `yarn deploy` to deploy this stack to AWS (prod stage specified in node command)
- Run `npm run remove` OR `yarn remove` to remove this stack to AWS (prod stage specified in node command)
- Run `sls deploy` to deploy this stack to AWS
- Run `sls remove` to remove this stack from AWS
    - add `--profile otherprofile` as a parameter for profile specific deployments

## Updating deployed lambdas

Updating the infrastructure related code in the serverless file just requires rerunning the `deploy` command

Updating code can be done faster & specific to the lambda function via the following commands: 

- `serverless deploy function -f create-post --region ap-southeast-2 --stage prod`
- `serverless deploy function -f update-post --region ap-southeast-2 --stage prod`
- `serverless deploy function -f delete-post --region ap-southeast-2 --stage prod`
- `serverless deploy function -f search-post --region ap-southeast-2 --stage prod`
- `serverless deploy function -f get-post --region ap-southeast-2 --stage prod`
- `serverless deploy function -f create-file --region ap-southeast-2 --stage prod`
- `serverless deploy function -f get-file --region ap-southeast-2 --stage prod`
- `serverless deploy function -f delete-file --region ap-southeast-2 --stage prod`
- `serverless deploy function -f login --region ap-southeast-2 --stage prod`
- `serverless deploy function -f register-user --region ap-southeast-2 --stage prod`
- `serverless deploy function -f reset-password --region ap-southeast-2 --stage prod`
- `serverless deploy function -f verify-token --region ap-southeast-2 --stage prod`
- `serverless deploy function -f forget-password --region ap-southeast-2 --stage prod`
- `serverless deploy function -f file-processor --region ap-southeast-2 --stage prod`

## Downgrade nodejs on your local machine to 14.15.0:

Unfortunately, post functions don't work with the latest node version

https://github.com/dherault/serverless-offline/issues/1150   
`sudo npm install -g n`   
`sudo n 14.15.0`   
`node -v`   

More dynamic way to update properties can be found in this blog:
https://dev.to/dvddpl/dynamodb-dynamic-method-to-insert-or-edit-an-item-5fnh

## Useful mentions

Delete all users in the Cognito user pool:

```shell
export COGNITO_USER_POOL_ID=<user_pool_id>; aws cognito-idp list-users --user-pool-id $COGNITO_USER_POOL_ID | jq -r '.Users | .[] | .Username' | xargs --max-args=1 -n 1 -P 5 -I % bash -c "echo Deleting %; aws cognito-idp admin-delete-user --user-pool-id $COGNITO_USER_POOL_ID --username %"
```

If you want cognito to use SES in sandbox mode, you'll need to verify emails in SES programmatically.
Otherwise, ask for production access to send emails without the need to verify emails in SES.
https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html
