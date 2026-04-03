from app.config import settings


async def download_from_s3(s3_key: str) -> bytes:
    """Download prescription image from S3 bucket."""
    try:
        import boto3
        
        s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )
        
        response = s3_client.get_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=s3_key,
        )
        
        return response["Body"].read()
        
    except ImportError:
        raise RuntimeError("boto3 not installed")
    except Exception as e:
        raise RuntimeError(f"Failed to download from S3: {e}")


async def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """Generate presigned URL for prescription image access."""
    try:
        import boto3
        
        s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )
        
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expiration,
        )
        
        return url
        
    except Exception as e:
        raise RuntimeError(f"Failed to generate presigned URL: {e}")
