import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import { partnerDAO } from "../../../dao";

export class CreatePartner {
    public constructor(private readonly t: EntityManager) {}

    public async quick(info: { partnerUUID?: string; content?: string } = {}) {
        const partnerInfo = {
            partnerUUID: info.partnerUUID || v4(),
            content: info.content || "",
        };

        await partnerDAO.insert(this.t, {
            partner_uuid: partnerInfo.partnerUUID,
            content: partnerInfo.content,
        });

        return partnerInfo;
    }
}
