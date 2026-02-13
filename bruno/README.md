# Bruno API Collection

This folder contains the Bruno API collection for testing the Secure Microservice Deployer.

## Setup

1. Install [Bruno](https://www.usebruno.com/)
2. Open Bruno and select "Open Collection"
3. Navigate to this `/bruno` folder
4. The collection will load with all endpoints

## Request Order

Execute the requests in this order for a complete workflow:

1. **Upload Image** - Upload the Docker image tar file
2. **Deploy Service** - Deploy the service to Kubernetes
3. **List Services** - Verify the deployment
4. **Access via Gateway** - Test the root endpoint
5. **Service Info** - Test the /info endpoint
6. **Delete Service** - Clean up when done

## Before Testing

Make sure the platform is running:
```bash
./scripts/deploy.sh
```

Build the example image:
```bash
./scripts/build-example.sh
```

## File Upload Note

For the "Upload Image" request, you may need to manually select the file in Bruno:
- Path: `../examples/simple-api/example-api.tar`
- Or use the absolute path: `/Users/jay/Desktop/cyber/secure-microservice-deployer/examples/simple-api/example-api.tar`
