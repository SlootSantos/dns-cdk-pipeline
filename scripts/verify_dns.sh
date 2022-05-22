#!/bin/bash
set -e

# making sure we read the NAME_SERVER variable from the CDK CFN output as an array
IFS=' ' read -r -a NS_ARRAY <<< "$DELEGATED_NAME_SERVERS"
# storing the name servers from the dig request as an array too
DIG_RESULT=($(dig +short NS ${DELEGATED_DOMAIN_NAME}))

for nsEntry in ${DIG_RESULT[@]};
do
    echo "checking: $nsEntry"
    # checking if that name server exists in the configured name server list
    if [[ " ${NS_ARRAY[*]} " =~ " ${nsEntry} " ]];
    then echo "Success!";
    else echo "Failure!" && exit 1;
    fi;
done

echo "successfully verified all Name Servers and delegated subdomain reachability"