import * as AWS from "aws-sdk"
import Amplify, {Auth} from "aws-amplify";

//hack - provide fetch function aws-amplify can use
declare var global: any;
global.fetch = require("node-fetch");

//set up the variables we'll need
//I think this username is a guid because the user pool is configured as an oauth endpoint
const username = "REPLACE_ME";
const password = "p1a2s3s4";
const identityPoolId = 'us-east-1:ad630c49-276b-4ea1-a0d5-e0aabfe2109e';
const region = "us-east-1";
const userPoolClientId = "7hp2255hib0b4fks7fpi9sosqm";
const userPoolId = "us-east-1_DLPmo5TQH";
const authority = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
const testBucket = "657653087923-test-bucket";

/* Prerequisites
    1. all the stuff above (user, identity and user pools) have been created in your aws account
    3. the identity pool has been setup to grant username read access to testBucket either via
        a. an Authenticated User role
        b. a rule
        c. a rolename in the cognito session token (if you figure out how to do that, tell me!)
    3. testBucket is not public (or our attempt to read from it will succed regardless)
*/

//log in with our user pool credentials

//see: https://aws-amplify.github.io/docs/js/authentication#sign-in
Amplify.configure({
    identityPoolId: identityPoolId,
    region: region,
    userPoolWebClientId: userPoolClientId,
    userPoolId: userPoolId
});

//set a region
AWS.config.region = "us-east-1";

//goes without saying this is a lot cleaner with async/await...
Auth.signIn(username, password)
.then(user => {
    console.log("Logged in! Getting AWS credentials from cognito identity.");

    //get get our cognito-defined aws credentials
    //see: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-integrating-user-pools-with-identity-pools.html
    user.getSession((err: any, result: any) => {
        if(err)
        {
            console.log("Error from getSession!");
            console.log(err);
        }
        else{
            let logins: any = {}
            logins[authority] = result.getIdToken().getJwtToken();
            let creds = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: identityPoolId,
                Logins: logins
            });
            
            //use the creds to talk to s3
            const s3 = new AWS.S3({
                credentials : creds
            });
            s3.listObjectsV2({Bucket: testBucket}, (error: any, listOutput: AWS.S3.ListObjectsV2Output) => {
                if(error)
                {
                    console.log("Error from S3!");
                    console.log(error);
                }
                else
                {
                    console.log("Read from S3 successfully!");
                }
            })
        }
        
    })
    
})
.catch(err => {
    console.log("error!");
    console.log(err);
})





