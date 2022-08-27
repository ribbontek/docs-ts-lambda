import { handleApiError } from "@libs/utils";
import { NotFoundException } from "@models/exception.model";
import { FileRepository } from "@repos/file-repository";
import { FileProcessorI } from "@services/file-processor.service";

export class ValidFileUploadedService implements FileProcessorI {

    constructor(private readonly fileRepository = new FileRepository()) {
    }

    public process = async (key: string): Promise<void> => {
        return this.saveAsUploaded(key.split("/").pop(), key.split("/")[1]);
    };

    private readonly saveAsUploaded = async (name: string, userId: string): Promise<void> => {
        return this.fileRepository.getByNameAndUserId(name, userId)
            .then(entity => {
                if (!!entity) {
                    this.fileRepository.markFileAsUploaded(entity.fileId, entity.userId);
                } else {
                    throw new NotFoundException(`File not found for name ${name} and user id ${userId}`);
                }
            })
            .catch(error => handleApiError(error));
    };
}
