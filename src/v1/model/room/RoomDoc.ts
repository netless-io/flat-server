import { sequelize } from "../../service/SequelizeService";
import { DataTypes, Model, Optional } from "sequelize";
import { MySQLBaseField } from "../types";
import { DocsType } from "../../controller/room/Constants";

export interface RoomDocAttributes {
    room_uuid: string;
    cyclical_uuid: string;
    doc_uuid: string;
    doc_type: DocsType;
    is_preload: boolean;
    created_at: string;
    updated_at: string;
    version: number;
    is_delete: boolean;
}

interface RoomDocField extends RoomDocAttributes, MySQLBaseField {}

interface RoomDocCreationAttributes extends Optional<RoomDocField, "id"> {}

export const RoomDocModel = sequelize.define<Model<RoomDocField, RoomDocCreationAttributes>>(
    "room_docs",
    {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        room_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        cyclical_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        doc_uuid: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        doc_type: {
            type: DataTypes.ENUM("Dynamic", "Static"),
            allowNull: false,
        },
        is_preload: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE(3),
            allowNull: false,
        },
        updated_at: {
            type: DataTypes.DATE(3),
            allowNull: false,
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_delete: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    },
);
