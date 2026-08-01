import type { CreateFileDto, ListFileDto, MoveFileDto, RenameFileDto } from '@repo/validation'

export class FileService {

    async createFile(dto: CreateFileDto, userId: string) {
        throw new Error('Not implemented')
    }

    async getAllFile(userId: string, query: ListFileDto['query']) {
        throw new Error('Not implemented')
    }

    async getFile(fileId: string, userId: string) {
        throw new Error('Not implemented')
    }

    async renameFile(dto: RenameFileDto, userId: string) {
        throw new Error('Not implemented')
    }

    async moveFile(dto: MoveFileDto, userId: string) {
        throw new Error('Not implemented')
    }

    async deleteFile(fileId: string, userId: string) {
        throw new Error('Not implemented')
    }
}
