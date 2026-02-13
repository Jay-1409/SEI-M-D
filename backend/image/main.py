"""
Image Service - Handles Docker image upload and loading
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import docker
import tempfile
import logging
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("image-service")

app = FastAPI(title="Image Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Docker client
try:
    docker_client = docker.from_env()
    logger.info("Docker client initialized successfully")
except Exception as e:
    logger.error(f"Docker client initialization failed: {e}")
    docker_client = None


class ImageInfo(BaseModel):
    name: str
    tags: list[str]
    size: int
    id: str


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload a Docker image tar file and load it into Docker."""
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    logger.info(f"Received image upload: {file.filename}")
    
    # Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix='.tar') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Load image into Docker
        with open(tmp_path, 'rb') as f:
            images = docker_client.images.load(f)
        
        # Get the loaded image details
        if images:
            image = images[0]
            image_name = image.tags[0] if image.tags else image.id
            
            # Inspect image to detect exposed ports
            try:
                image_details = docker_client.images.get(image_name)
                exposed_ports = image_details.attrs.get('Config', {}).get('ExposedPorts', {})
                
                # Extract port numbers
                ports = []
                if exposed_ports:
                    ports = [int(port.split('/')[0]) for port in exposed_ports.keys()]
                
                logger.info(f"Image loaded: {image_name}, ports: {ports}")
                
                return {
                    "success": True,
                    "image_name": image_name,
                    "image_id": image.id,
                    "ports": ports,
                    "tags": image.tags,
                    "size": image_details.attrs.get('Size', 0)
                }
            except Exception as e:
                logger.warning(f"Could not inspect image: {e}")
                return {
                    "success": True,
                    "image_name": image_name,
                    "image_id": image.id,
                    "ports": [],
                    "tags": image.tags,
                    "size": 0
                }
        else:
            raise HTTPException(status_code=400, detail="No image found in tar file")
    
    except Exception as e:
        logger.error(f"Image load failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load image: {str(e)}")


@app.get("/images")
async def list_images():
    """List all Docker images."""
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        images = docker_client.images.list()
        result = []
        
        for img in images:
            result.append(ImageInfo(
                name=img.tags[0] if img.tags else img.id[:12],
                tags=img.tags,
                size=img.attrs.get('Size', 0),
                id=img.id
            ))
        
        return result
    except Exception as e:
        logger.error(f"Failed to list images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/images/{image_name}")
async def delete_image(image_name: str):
    """Delete a Docker image."""
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        docker_client.images.remove(image_name, force=True)
        logger.info(f"Image deleted: {image_name}")
        return {"success": True, "message": f"Image '{image_name}' deleted"}
    except docker.errors.ImageNotFound:
        raise HTTPException(status_code=404, detail=f"Image '{image_name}' not found")
    except Exception as e:
        logger.error(f"Failed to delete image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "healthy", "service": "image-service"}
