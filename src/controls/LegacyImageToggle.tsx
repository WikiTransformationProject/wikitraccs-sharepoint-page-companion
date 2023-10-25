import { Spinner, SpinnerSize, Toggle } from "@fluentui/react";
import * as React from "react";
import { useCallback, useEffect, useState} from "react";
import { subscribe, useSnapshot } from "valtio";
import { globalState } from "../store";

export const LegacyImageToggle: React.FunctionComponent<{}> = (props)  => {
    const [checked, setChecked] =useState(globalState.isLegacyImageMode.value);
    const isInEditModeSnap = useSnapshot(globalState.isInEditMode);
    const isOnPageThatWasMigratedByWikiTraccsSnap = useSnapshot(globalState.isOnPageThatWasMigratedByWikiTraccs);
    const isSavingSnap = useSnapshot(globalState.isSaving);

    const handleOnChange = useCallback((event: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
        globalState.isLegacyImageMode.value = checked;
    }, []);

    useEffect(() => subscribe(globalState.isLegacyImageMode, () => {
        setChecked(globalState.isLegacyImageMode.value);
    }), []);

    return isInEditModeSnap.value && isOnPageThatWasMigratedByWikiTraccsSnap.value ? <div id="wtLegacyImageMode" style={{ 
        position: "fixed", 
        boxSizing: "border-box", 
        zIndex: 9998,
        bottom: "24px",
        right: "24px",
        backgroundColor: "white",
        borderRadius: "1%",
        boxShadow: "0 0 4px rgba(0, 0, 0, 0.14), 0 4px 8px rgba(0, 0, 0, 0.28)",
        padding: "12px"
        }}>
        <Toggle label="Legacy image positioning" checked={checked ?? false} onText="On" offText="Off" onChange={handleOnChange} />
        { (isSavingSnap.value) && <Spinner style={{position: "absolute", right: "4px", bottom: "4px"}} size={SpinnerSize.xSmall} /> }
        
    </div> : null;
}
