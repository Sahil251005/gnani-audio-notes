from app.storage import s3, BUCKET_NAME

response = s3.list_objects_v2(Bucket=BUCKET_NAME)

print("R2 connection successful")
print(response.get("Contents", []))