import { proxy } from "valtio";

export interface IGlobalState {
    isInEditMode: { value: boolean | undefined };
    isLegacyImageMode: { value: boolean | undefined }
    isSaving: { value : boolean | undefined }
    isOnPageThatWasMigratedByWikiTraccs: { value: boolean | undefined }
}

const initialGlobalState: IGlobalState = {
    isLegacyImageMode: { value: undefined },
    isInEditMode: { value: false },
    isSaving: { value: false },
    isOnPageThatWasMigratedByWikiTraccs: { value: false }
}

export const globalState = proxy(initialGlobalState);