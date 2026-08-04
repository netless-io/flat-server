import axios from "axios";
import { createHash } from "crypto";
import { ClassroomResources } from "../constants/Config";
import {
    ClassroomResourceProfile,
    getClassroomResourceProfile,
    getDefaultClassroomResourceProfile,
} from "./Registry";

export type ClassroomResourceReservation = {
    operationID: string;
    reservationStatus: string;
    resourceProfileKey: string;
    assignmentSource: string;
    expiresAt: string;
};

function enabled(): boolean {
    return Boolean(
        ClassroomResources?.billing_base_url && ClassroomResources?.billing_internal_token,
    );
}

export function normalizeClassroomResourceOperationID(value: unknown, fallback: string): string {
    const operationID = String(value || fallback).trim() || fallback;
    if (operationID.length <= 64) {
        return operationID;
    }
    return createHash("sha256").update(operationID).digest("hex");
}

export async function reserveClassroomResource(
    teacherUUID: string,
    objectType: "room" | "periodic",
    operationID: string,
): Promise<{ reservation: ClassroomResourceReservation; profile: ClassroomResourceProfile }> {
    if (!enabled()) {
        const profile = getDefaultClassroomResourceProfile();
        return {
            reservation: {
                operationID,
                reservationStatus: "pending",
                resourceProfileKey: profile.key,
                assignmentSource: "legacy_default",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            },
            profile,
        };
    }
    const response = await axios.post(
        `${ClassroomResources!.billing_base_url.replace(/\/$/, "")}/v1/internal/classroom-resources/reservations`,
        { teacherUUID, objectType, operationID },
        {
            headers: { "X-Internal-Token": ClassroomResources!.billing_internal_token },
            timeout: 3000,
        },
    );
    const reservation = response.data.data as ClassroomResourceReservation;
    return {
        reservation,
        profile: getClassroomResourceProfile(reservation.resourceProfileKey),
    };
}

export async function confirmClassroomResourceReservation(
    operationID: string,
    objectUUID: string,
): Promise<void> {
    if (!enabled()) {
        return;
    }
    await axios.post(
        `${ClassroomResources!.billing_base_url.replace(/\/$/, "")}/v1/internal/classroom-resources/reservations/${encodeURIComponent(operationID)}/confirm`,
        { objectUUID },
        {
            headers: { "X-Internal-Token": ClassroomResources!.billing_internal_token },
            timeout: 3000,
        },
    );
}

export async function cancelClassroomResourceReservation(operationID: string): Promise<void> {
    if (!enabled()) {
        return;
    }
    await axios.post(
        `${ClassroomResources!.billing_base_url.replace(/\/$/, "")}/v1/internal/classroom-resources/reservations/${encodeURIComponent(operationID)}/cancel`,
        {},
        {
            headers: { "X-Internal-Token": ClassroomResources!.billing_internal_token },
            timeout: 3000,
        },
    );
}
