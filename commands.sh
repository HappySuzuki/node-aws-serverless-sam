# Build the source of your application
sam build

# Run API Gateway locally
sam local start-api

# Run dynamodb docker image
docker-compose up

# Create dynamodb table
aws dynamodb create-table --table-name SampleTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --endpoint-url http://localhost:8000

# List dynamodb tables
aws dynamodb list-tables --endpoint-url http://localhost:8000