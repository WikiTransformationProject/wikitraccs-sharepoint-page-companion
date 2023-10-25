import * as React from "react"
import { CssEnhancer } from "./CssEnhancer"
import { LegacyImageToggle } from "./LegacyImageToggle"

export const TopPlaceholder: React.FunctionComponent<{}> = (props)  => {
    return <>
        <CssEnhancer />
        <LegacyImageToggle />
    </>
}
