import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

export enum DeveloperOAuthScope {
    UserUUIDRead = "user.uuid:read",
    UserNameRead = "user.name:read",
    UserAvatarRead = "user.avatar:read",
}

@Entity({
    name: "oauth_infos",
})
export class OAuthInfosModel extends Content {
    @Index("oauth_infos_oauth_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    oauth_uuid: string;

    @Index("oauth_infos_owner_uuid_index")
    @Column({
        length: 40,
    })
    owner_uuid: string;

    @Column({
        length: 30,
        comment: "application name",
    })
    app_name: string;

    @Column({
        length: 300,
        comment: "application description",
    })
    app_desc: string;

    @Index("oauth_infos_client_id_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    client_id: string;

    @Column({
        length: 100,
        comment: "application homepage url",
    })
    homepage_url: string;

    @Column({
        length: 300,
        comment: "application logo url",
    })
    logo_url: string;

    @Column({
        length: 300,
    })
    scopes: string;

    // per callback length must less than 400
    // max callback count is 5
    @Column({
        length: 2005,
    })
    callbacks_url: string;

    @Index("oauth_infos_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
