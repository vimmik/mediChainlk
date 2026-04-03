variable "project" { type = string }
variable "environment" { type = string }

resource "aws_s3_bucket" "prescriptions" {
  bucket = "${var.project}-prescriptions-${var.environment}"
}

resource "aws_s3_bucket_versioning" "prescriptions" {
  bucket = aws_s3_bucket.prescriptions.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "prescriptions" {
  bucket = aws_s3_bucket.prescriptions.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "prescriptions" {
  bucket                  = aws_s3_bucket.prescriptions.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket_name" { value = aws_s3_bucket.prescriptions.id }
output "bucket_arn" { value = aws_s3_bucket.prescriptions.arn }
