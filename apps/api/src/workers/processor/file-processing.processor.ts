import { Job } from "bullmq";

export async function processFileJob(
    job: Job
) {
    try {
        console.log(`Processing job: ${job.id}`)

        console.log("Job Name: ", job.name)

        console.log("Job Data: ", job.data)

        return {
            success: true
        }
    } catch (error) {
        console.log(error)

        return {
            success: false
        }
    }
}