import { useEffect, useState } from "react";
import { subscribe } from "valtio";
import { globalState } from "../store";

export const CssEnhancer: React.FunctionComponent<{}> = (props)  => {
    const cssOn = `
    div.containerPlugin, div.imagePlugin {
      clear: none;
    }
  `;
  const cssOff = `
`;  
    const [style, setStyle] = useState(globalState.isLegacyImageMode.value ? cssOn : cssOff)

    useEffect(() => subscribe(globalState.isLegacyImageMode, () => {
        if (globalState.isLegacyImageMode.value) {
            setStyle(cssOn);
        } else {
            setStyle(cssOff);
        }

    }), []);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = style;
    document.head.appendChild(styleElement);

    return () => {
      // Remove the style element when the component unmounts
      document.head.removeChild(styleElement);
    };
  }, [style]);

  return null; // This component doesn't render any visible content
}
