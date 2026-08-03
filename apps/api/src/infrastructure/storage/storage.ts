import { Storage } from "@google-cloud/storage";
import config from "../../config/env";

export const storage = new Storage({
    projectId: config.gcp_project_id, 
    credentials: { 
        client_email: config.gcp_client_email,
        private_key: config.gcp_private_key
    }
})

export const bucket = storage.bucket(config.gcp_bucket_name)