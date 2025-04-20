/**
 * Shared module for Gource configurations
 * Copied from the root /shared directory to comply with CRA import rules.
 * This file serves as a single source of truth for Gource default settings
 */
interface GourceSettings {
    resolution?: string;
    framerate?: number;
    secondsPerDay?: number;
    autoSkipSeconds?: number;
    elasticity?: number;
    title?: boolean | string;
    key?: boolean;
    background?: string;
    fontScale?: number;
    cameraMode?: 'overview' | 'track' | 'follow';
    userScale?: number;
    timeScale?: number;
    highlightUsers?: boolean;
    hideUsers?: string;
    hideProgress?: boolean;
    hideMouse?: boolean;
    hideFilenames?: boolean;
    hideRoot?: boolean;
    hideFiles?: boolean;
    hideDirnames?: boolean;
    hideUsernames?: boolean;
    hideDate?: boolean;
    hideTree?: boolean;
    hideBloom?: boolean;
    maxUserCount?: number;
    titleText?: string;
    showDates?: boolean;
    disableProgress?: boolean;
    disableAutoRotate?: boolean;
    showLines?: boolean;
    followUsers?: boolean;
    maxFilelag?: number;
    multiSampling?: boolean;
    bloom?: boolean;
    bloomIntensity?: number;
    bloomMultiplier?: number;
    extraArgs?: string;
    dateFormat?: string;
    timePeriod?: 'all' | 'week' | 'month' | 'year';
    startDate?: string;
    stopDate?: string;
    startPosition?: string;
    stopPosition?: string;
    stopAtTime?: number;
    loop?: boolean;
    loopDelaySeconds?: number;
    fontSize?: number;
    filenameFontSize?: number;
    dirnameFontSize?: number;
    userFontSize?: number;
    fontColor?: string;
    dirColor?: string;
    highlightColor?: string;
    selectionColor?: string;
    filenameColor?: string;
    transparent?: boolean;
    dirNameDepth?: number;
    dirNamePosition?: number;
    filenameTime?: number;
    maxFiles?: number;
    fileIdleTime?: number;
    fileIdleTimeAtEnd?: number;
    fileExtensions?: boolean;
    fileExtensionFallback?: boolean;
    useUserImageDir?: boolean;
    defaultUserImage?: string;
    fixedUserSize?: boolean;
    colourImages?: boolean;
    userFriction?: number;
    maxUserSpeed?: number;
    backgroundImage?: string;
    logo?: string;
    logoOffset?: string;
    fullscreen?: boolean;
    screenNum?: number;
    noVsync?: boolean;
    windowPosition?: string;
    frameless?: boolean;
    cropAxis?: 'vertical' | 'horizontal' | '';
    padding?: number;
    stopAtEnd?: boolean;
    dontStop?: boolean;
    disableAutoSkip?: boolean;
    realtime?: boolean;
    noTimeTravel?: boolean;
    highlightDirs?: boolean;
    disableInput?: boolean;
    hashSeed?: string;
    userFilter?: string;
    userShowFilter?: string;
    fileFilter?: string;
    fileShowFilter?: string;
    highlightUser?: string;
    captionFile?: string;
    captionSize?: number;
    captionColour?: string;
    captionDuration?: number;
    captionOffset?: number;
    fontFile?: string;
    followUser?: string;
    outputCustomLog?: string;
    gitBranch?: string;
    hide?: string[];
    [key: string]: any;
}
declare const defaultSettings: GourceSettings;
declare const defaultGourceConfig: {
    id: string;
    name: string;
    description: string;
    settings: GourceSettings;
    isDefault: boolean;
    dateCreated: string;
    lastModified: string;
};
declare const settingsDescriptions: {
    [key: string]: string;
};
/**
 * Calcule les dates de début et de fin basées sur une période
 * @param {string} period - La période ('week', 'month', 'year', 'all')
 * @returns {Object} startDate et stopDate
 */
declare function calculateDatesFromPeriod(period: 'week' | 'month' | 'year' | 'all'): {
    startDate: string;
    stopDate: string;
};
/**
 * Convertit les paramètres de configuration en arguments pour la ligne de commande Gource
 * Version simplifiée pour éviter les problèmes de conversion
 * @param {GourceSettings} settings - Paramètres de configuration
 * @returns {string} Arguments pour Gource au format ligne de commande
 */
declare function convertToGourceArgs(settings: GourceSettings): string;
export { defaultGourceConfig, defaultSettings, settingsDescriptions, convertToGourceArgs, calculateDatesFromPeriod, GourceSettings };
