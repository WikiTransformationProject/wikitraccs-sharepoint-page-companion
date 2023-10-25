import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer, PlaceholderContent, PlaceholderName, PlaceholderProvider
} from '@microsoft/sp-application-base';

import * as packageSolution from '../../../config/package-solution.json';
import * as strings from 'WikitraccsSpPageCompanionApplicationCustomizerStrings';

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import "@pnp/sp/items";
import "@pnp/sp/security/list";
import { spfi, SPFI, SPFx } from '@pnp/sp';
import { debounce } from 'lodash';
import { PermissionKind } from '@pnp/sp/security';
import { FieldTypes } from '@pnp/sp/fields/types';
// import { LegacyImageToggle } from '../../controls/LegacyImageToggle';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { globalState } from '../../store';
import { subscribe } from 'valtio';
import { TopPlaceholder } from '../../controls/TopPlaceholder';

const LOG_SOURCE: string = 'WikiTraccs Page Companion';
const PAGESETTINGSLISTTITLE: string = "WtPageSettings";

export interface IWikitraccsSpPageCompanionApplicationCustomizerProperties {
  // This is an example; replace with your own property
  testMessage: string;
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class WikitraccsSpPageCompanionApplicationCustomizer
  extends BaseApplicationCustomizer<IWikitraccsSpPageCompanionApplicationCustomizerProperties> {

  private _solutionVersion: string | undefined;
  private _manifestVersion: string | undefined;
  private _spfi: SPFI | undefined;
  private _currentSiteId: string | undefined;
  private _currentListId: string | undefined;
  private _currentListItemId: number | undefined;
  private _checkForContextUpdateDebounced: (() => void) = debounce(this.checkForContextUpdate, 200);
  private _topPlaceholder: PlaceholderContent | undefined;
  private _observer: MutationObserver | undefined;
  private _unsubscribe: () => void | undefined;

  protected override async onInit(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._solutionVersion = `${(<any>packageSolution).solution.version}`;
    this._manifestVersion = `${this.context.manifest.version}`;

    Log.info(LOG_SOURCE, `Initialized ${strings.Title}, SOLUTION VERSION: ${this._solutionVersion}, MANIFEST VERSION: ${this._manifestVersion}`);

    this._spfi = spfi().using(SPFx(this.context));
    this.context.placeholderProvider.changedEvent.add(this, this._checkForContextUpdateDebounced);
    this.context.application.navigatedEvent.add(this, this._checkForContextUpdateDebounced);
    this._checkForContextUpdateDebounced();
    this.initMutationObserver();

    this.updateCachedContext();
    await this.ensureListExistenceAsync();
    await this.retrieveLegacyImageModeForCurrentPageAsync();

    this._unsubscribe = subscribe(globalState.isLegacyImageMode, (ops) => {
      // if the state to set or the previous state is undefined: don't save; setting or resetting is triggered by us and doesn't need to be saved
      // eslint-disable-next-line eqeqeq
      if (ops[0][2] == undefined || ops[0][3] == undefined) {
        return;
      }
      // eslint-disable-next-line no-void
      void this.saveCurrentLegacyImageStateAsync();
    });

    return Promise.resolve();
  }

  private async retrieveLegacyImageModeForCurrentPageAsync(): Promise<void> {
    const state = await this.getLegacyImageStateAsync();
    // eslint-disable-next-line require-atomic-updates
    globalState.isLegacyImageMode.value = state;
  }

  protected override onDispose(): void {
    const o = this._observer;
    this._observer = undefined;
    o?.disconnect();

    this._unsubscribe?.();
  }

  private async saveCurrentLegacyImageStateAsync(): Promise<void> {
    if (!this._spfi) {
      return;
    }

    if (!this._currentListItemId) {
      return;
    }

    globalState.isSaving.value = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingItems: { Id: number }[] = await this._spfi.web.lists.getByTitle(PAGESETTINGSLISTTITLE).items.filter(`wtPId eq ${this._currentListItemId}`)();
      for (const item of existingItems) {
        await this._spfi.web.lists.getByTitle(PAGESETTINGSLISTTITLE).items.getById(item.Id).delete();
      }
      await this._spfi.web.lists.getByTitle(PAGESETTINGSLISTTITLE).items.add({
        Title: "",
        wtPId: this._currentListItemId,
        wtLegacyImagesEnabled: globalState.isLegacyImageMode.value
      });
    } finally {
      // eslint-disable-next-line require-atomic-updates
      globalState.isSaving.value = false;
    }
  }

  private async getLegacyImageStateAsync(checkForChangedListItemId: boolean = true): Promise<boolean> {
    if (!this._spfi) {
      return false;
    }

    if (!this.context.pageContext?.listItem?.id) {
      return false;
    }

    const existingItems: { wtLegacyImagesEnabled: boolean, Id: number }[] = await this._spfi.web.lists.getByTitle(PAGESETTINGSLISTTITLE).items.filter(`wtPId eq ${this.context.pageContext.listItem.id}`)();
    if (existingItems.length > 0) {
      // when navigating between pages it can happen that we refresh the state, and the list item ID in the context changes; check for that
      if (checkForChangedListItemId) {
        if (existingItems[0].Id !== this.context.pageContext?.listItem?.id) {
          return await this.getLegacyImageStateAsync(false);
        }
      }

      return existingItems[0].wtLegacyImagesEnabled;
    }
    return false;
  }

  // need some mechanism to detect pages entering edit mode; mutation observer is one way to do it, although and indirect one
  private initMutationObserver(): void {
    let previousUrl = '';
    this._observer = new MutationObserver((mutations) => {
      if (window.location.href !== previousUrl) {
        previousUrl = window.location.href;
//        console.log(`URL changed from ${previousUrl} to ${window.location.href}`);
        this.handleUrlChange();
      }
    });
    const config = { subtree: true, childList: true };

    // start listening to changes
    this._observer.observe(document, config);
  }

  private handleUrlChange(): void {
    this._checkForContextUpdateDebounced();
  }

  protected override onPlaceholdersChanged(placeholderProvider: PlaceholderProvider): void {
    this._checkForContextUpdateDebounced();
  }

  private updateCachedContext(): void {
    this._currentSiteId = this.context?.pageContext?.site?.id?.toString();
    this._currentListId = this.context?.pageContext?.list?.id?.toString();
    this._currentListItemId = this.context?.pageContext?.listItem?.id;
  }

  private didContextChange(): boolean {
    const pageChanged = this.context?.pageContext?.site?.id?.toString() !== this._currentSiteId
      || this.context?.pageContext?.list?.id?.toString() !== this._currentListId
      || this.context?.pageContext?.listItem?.id?.toString() !== this._currentListItemId;

    const isPageInEditMode = this.isPageInEditMode();
    const editModeChanged = isPageInEditMode !== globalState.isInEditMode.value;
    globalState.isInEditMode.value = isPageInEditMode;

    return pageChanged || editModeChanged;
  }

  private isOnPage(): boolean {
    // note: first check does not work on home page, but second check covers this
    return window.location.href.toLowerCase().indexOf("sitepages") > -1
      || (this.context?.pageContext?.list?.serverRelativeUrl?.toLowerCase().indexOf("sitepages") ?? -1) > -1;
  }

  private async ensureListExistenceAsync(): Promise<void> {
    try {
      await this._spfi?.web.lists.getByTitle(PAGESETTINGSLISTTITLE)();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const listDoesNotExist = (error.message?.indexOf(`List '${PAGESETTINGSLISTTITLE}' does not exist at site`) ?? -1) > -1;
      Log.info(LOG_SOURCE, `List ${PAGESETTINGSLISTTITLE} does not exist, need to create`);

      if (listDoesNotExist) {
        const hasPermission = await this.hasPermissionToCreateListAsync();
        if (hasPermission) {
          await this.createListAsync();
        } else {
          console.error("You don't have permissions to manage lists. Cannot create list.");
        }
      }
    }
  }

  private async hasPermissionToCreateListAsync(): Promise<boolean> {
    if (!this._spfi) {
      return false;
    }

    const result = await this._spfi.web.currentUserHasPermissions(PermissionKind.ManageLists);
    return result;
  }

  private async createListAsync(): Promise<boolean> {
    if (!this._spfi) {
      return false;
    }
    try {
      // Create the list
      await this._spfi.web.lists.add(PAGESETTINGSLISTTITLE, "WikiTraccs Page Settings", 100, false, { Hidden: true });

      await this
        ._spfi
        .web
        .lists
        .getByTitle(PAGESETTINGSLISTTITLE)
        .fields
        .add("wtPId", FieldTypes.Number, { Indexed: true });

      await this
        ._spfi
        .web
        .lists
        .getByTitle(PAGESETTINGSLISTTITLE)
        .fields
        .add("wtLegacyImagesEnabled", FieldTypes.Boolean, { Indexed: true });

      console.log('List and fields created successfully.');

    } catch (error) {
      console.log('Error creating list and/or fields:', error);
      return false;
    }

    return true;
  }

  private isPageInEditMode(href: string = window.location.href): boolean {
    return this.isOnPage() && href.toLowerCase().indexOf("mode=edit") > -1;
  }

  private delayAsync(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // note: this does not work for home page... alas, have to navigate to the page directly
  private updateMigratedPageState(): void {
    const href = window.location.href;
    // migrated page names start with space key, then whatever, then page ID, separated by dash; might match other pages, but I doubt it
    const migratedPageRegex = /[^/]+?-[^/]+?-[0-9]+?\.aspx/g;
    const match = href.match(migratedPageRegex);
    globalState.isOnPageThatWasMigratedByWikiTraccs.value = !!match;
  }

  private checkForContextUpdate(): void {
    if (!this._topPlaceholder) {
      this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Top,
        { onDispose: this._onDispose }
      );
    }

    this.updateMigratedPageState();

    if (!this.context) {
      return;
    }

    const didContextChange = this.didContextChange();
    if (!didContextChange) {
      return;
    }
    // reset, to load it anew for the new page
    globalState.isLegacyImageMode.value = undefined;

    if (this._topPlaceholder && (!this._topPlaceholder?.domElement || didContextChange)) {
      const element: React.ReactElement<{}> = React.createElement(
        TopPlaceholder, {
      }
      );
      // eslint-disable-next-line @microsoft/spfx/pair-react-dom-render-unmount
      ReactDom.render(element, this._topPlaceholder.domElement);
    }

    this.updateCachedContext();
    // note: inserting delay to give page time to jiggle
    // eslint-disable-next-line no-void
    void this.delayAsync(0).then(() => this.retrieveLegacyImageModeForCurrentPageAsync());
    if (!this.isOnPage()) {
      return;
    }
  }

  private _onDispose(): void {
    if (this._topPlaceholder?.domElement) {
      Log.info(LOG_SOURCE, "Disposing top placeholder");
      ReactDom.unmountComponentAtNode(this._topPlaceholder.domElement);
    }
  }

}