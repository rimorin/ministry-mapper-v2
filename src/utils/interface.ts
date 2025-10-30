import { AuthModel } from "pocketbase";
import { LinkSession, Policy } from "./policies";
import { Value } from "react-calendar/dist/shared/types";
import { MultiValue } from "react-select";
export interface userInterface {
  user: AuthModel;
}

interface nameInterface {
  name: string;
}

interface mapInterface {
  mapId: string;
}

interface mapCodeInterface {
  mapCode: string;
}

interface congregationInterface {
  congregation: string;
}

interface footerInterface {
  footerSaveAcl: string;
}

interface floorInterface {
  floor: number;
  floorDisplay?: string;
}

export interface typeInterface {
  id: string;
  code: string;
}

export interface unitDetails {
  id: string;
  number: string;
  note: string;
  type: typeInterface[];
  status: string;
  nhcount: string;
  dnctime: number;
  floor: number;
  sequence: number;
  coordinates?: latlongInterface;
  updated?: number;
  updatedBy?: string;
  totalunits?: number;
}

export interface nothomeProps {
  nhcount?: string;
  classProp?: string;
}

export interface floorDetails extends floorInterface {
  units: Array<unitDetails>;
}

export interface unitProps {
  type: typeInterface[];
  note?: string;
  status: string;
  nhcount?: string;
  defaultOption?: string;
}

export interface valuesDetails extends floorInterface, nameInterface {
  unit: string;
  unitDisplay?: string;
  type: string;
  note: string;
  postal?: string;
  feedback: string;
  status: string;
  link?: string;
  nhcount?: string;
  units?: string;
  floors?: number;
  newPostal?: string;
  code?: string;
  dnctime?: number;
  sequence: string;
  unitlength?: number;
  territoryType?: number;
  password?: string;
  cpassword?: string;
  propertyPostal?: string;
  instructions?: string;
  linkid?: string;
  linkExpiryHrs?: number;
  map?: string;
}

export type DropDirection = "up" | "down";
export type DropDirections = { [key: string]: DropDirection };

export type adminProps = userInterface;

export interface territoryDetails extends nameInterface {
  id: string;
  code: string;
  aggregates: number;
}

export interface addressDetails
  extends nameInterface,
    mapInterface,
    coordinatesInterface {
  id: string;
  assigneeDetailsList: Array<LinkSession>;
  personalDetailsList: Array<LinkSession>;
  floors: Array<floorDetails>;
  type: string;
  location?: string;
  aggregates: AggregatesProps;
}

export interface FormProps {
  handleChange?: (event: React.ChangeEvent<HTMLElement>) => void;
  handleClick?: (event: React.MouseEvent<HTMLElement>) => void;
  handleGroupChange?: (
    value: string,
    event: React.ChangeEvent<HTMLElement>
  ) => void;
  handleChangeValues?: (values: string[]) => void;
  handleDateChange?: (date: Value) => void;
  changeDate?: number;
  changeValue?: string;
  changeValues?: string[];
  name?: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  information?: string;
  inputType?: string;
  readOnly?: boolean;
  focus?: boolean;
  autoComplete?: string;
}

export interface FloorProps {
  handleChange?: (event: React.ChangeEvent<HTMLElement>) => void;
  changeValue: number;
}

export interface TitleProps extends nameInterface, floorInterface {
  unit: string;
  type?: string;
}

export interface BrandingProps {
  naming: string;
}

export interface FooterProps {
  isSaving?: boolean;
  disableSubmitBtn?: boolean;
  userAccessLevel?: string;
  requiredAcLForSave?: string;
  submitLabel?: string;
  handleClick?: (event: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
}

export interface SubmitBtnProps {
  isSaving: boolean;
  btnLabel?: string;
  disabled?: boolean;
}

export interface LegendProps {
  showLegend: boolean;
  hideFunction?: () => void;
}

export interface TerritoryListingProps {
  showListing: boolean;
  hideFunction: () => void;
  selectedTerritory?: string;
  handleSelect?: (
    eventKey: string | null,
    e: React.SyntheticEvent<unknown>
  ) => void;
  territories?: territoryDetails[];
  hideSelectedTerritory?: boolean;
}

export interface AuthorizerProp {
  requiredPermission: string;
  userPermission: string | undefined;
  children: React.ReactElement;
}

export interface aggregateBadgeProp {
  aggregate?: number;
  width?: string;
}

export interface ExpiryButtonProp {
  endtime: number;
}

export interface floorHeaderProp extends floorInterface {
  index: number;
}

export interface tableHeaderProp {
  floors: Array<floorDetails>;
  maxUnitNumber: number;
}

export interface territoryHeaderProp {
  name: string | undefined;
}

export interface backToTopProp {
  showButton: boolean;
}

export interface territoryTableProps {
  mapView?: boolean;
  policy: Policy;
  addressDetails: addressDetails;
  assignmentId?: string;
  handleUnitStatusUpdate?: (event: React.MouseEvent<HTMLElement>) => void;
  handleUnitNoUpdate?: (event: React.MouseEvent<HTMLElement>) => void;
  handleFloorDelete?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface territoryMultiProps {
  floors: floorDetails[];
  addressDetails: addressDetails;
  policy: Policy;
  maxUnitLength: number;
  handleUnitStatusUpdate: (event: React.MouseEvent<HTMLElement>) => void;
  handleFloorDelete?: (event: React.MouseEvent<HTMLElement>) => void;
  handleUnitDelete?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface territorySingleProps {
  houses: floorDetails;
  policy: Policy;
  addressDetails: addressDetails;
  handleHouseUpdate: (
    event: React.MouseEvent<HTMLElement> | google.maps.MapMouseEvent
  ) => void;
}

export interface SignInDifferentProps {
  handleClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface HelpButtonProps {
  link: string;
  isWarningButton?: boolean;
}

export interface userDetails extends nameInterface {
  email: string;
  verified: boolean;
  role: string;
  roleId: string;
}

export type CongregationAccessObject = {
  code: string;
  name: string;
  access: string;
};

export interface CongregationListingProps {
  showListing: boolean;
  hideFunction: () => void;
  currentCongCode: string;
  handleSelect?: (
    eventKey: string | null,
    e: React.SyntheticEvent<unknown>
  ) => void;
  congregations?: CongregationAccessObject[];
}

export interface UserListingProps {
  showListing: boolean;
  hideFunction: () => void;
  handleSelect?: (
    eventKey: string | null,
    e: React.SyntheticEvent<unknown>
  ) => void;
  users?: userDetails[];
}

export interface UserRoleProps {
  handleRoleChange?: (
    value: string,
    event: React.ChangeEvent<HTMLElement>
  ) => void;
  role?: string;
  isUpdate?: boolean;
}

export interface UserModalProps
  extends nameInterface,
    congregationInterface,
    footerInterface {
  email?: string | null;
  uid: string;
  role?: string | undefined;
}

export interface SelectProps {
  value: string;
  label: string;
}

export interface OptionProps {
  code: string;
  description: string;
}

export interface HouseholdProps {
  handleChange?: (option: MultiValue<SelectProps>) => void;
  changeValue?: typeInterface[];
  options: Array<SelectProps>;
}

export interface HHOptionProps {
  id: string;
  code: string;
  description: string;
  isCountable: boolean;
  isDefault?: boolean;
  sequence: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

export interface EnvironmentIndicatorProps {
  environment: string;
}

export interface UserRoleBadgeProps {
  role: string | undefined;
}

export type WelcomeProps = nameInterface;
export interface AssignmentModalProps extends congregationInterface {
  assignments: LinkSession[];
  assignmentType?: string;
  assignmentTerritory?: string;
}

export interface ChangeAddressNameModalProps
  extends nameInterface,
    footerInterface,
    congregationInterface,
    mapInterface {}

export interface ChangeAddressMapCodeModalProps
  extends mapInterface,
    mapCodeInterface,
    footerInterface {
  territoryCode: string | undefined;
}

export interface latlongInterface {
  lat: number;
  lng: number;
}

export interface coordinatesInterface {
  coordinates: latlongInterface;
}

export interface originInterface {
  origin: string;
}

export interface ConfigureAddressCoordinatesModalProps
  extends mapInterface,
    congregationInterface,
    footerInterface,
    coordinatesInterface,
    nameInterface,
    originInterface {
  isSelectOnly: boolean;
}

export interface GetMapGeolocationModalProps
  extends coordinatesInterface,
    originInterface,
    nameInterface {}

export interface ChangeTerritoryCodeModalProps
  extends congregationInterface,
    footerInterface {
  territoryCode: string;
  territoryId: string;
}

export interface ChangeTerritoryNameModalProps
  extends congregationInterface,
    footerInterface {
  name: string | undefined;
  territoryCode: string;
}

export interface UpdateCongregationOptionsModalProps {
  currentCongregation: string;
}

export interface UpdateCongregationSettingsModalProps {
  currentName: string;
  currentCongregation: string;
  currentMaxTries: number;
  currentDefaultExpiryHrs: number;
  currentIsMultipleSelection: boolean;
}

export interface NewPrivateAddressModalProps
  extends congregationInterface,
    footerInterface,
    originInterface {
  territoryCode: string;
  defaultType: string;
}

export type NewPublicAddressModalProps = NewPrivateAddressModalProps;

export interface NewTerritoryCodeModalProps
  extends congregationInterface,
    footerInterface {}

export interface NewUnitModalProps
  extends mapInterface,
    footerInterface,
    congregationInterface {
  addressData: addressDetails;
  defaultType: string;
}

export type UpdateProfileModalProps = userInterface;

export interface ConfirmSlipDetailsModalProps {
  addressName: string;
  userAccessLevel: string | undefined;
  isPersonalSlip: boolean;
}

export interface UpdateAddressFeedbackModalProps
  extends nameInterface,
    mapInterface,
    footerInterface {
  helpLink: string;
  currentName: string;
  policy: Policy;
  messageType: string;
  messages: Array<Message>;
  assignmentId?: string;
}

export interface UpdateAddressStatusModalProps {
  addressData: addressDetails | undefined;
  unitDetails: unitDetails;
  policy: Policy;
}

export interface AggregatesProps {
  value: number;
  display: string;
  notHome: number;
  notDone: number;
}

export interface Message {
  id: string;
  message: string;
  read: boolean;
  pinned: boolean;
  created: Date;
  created_by: string;
  type: string;
}

export interface GeneratedMapModalProps {
  territoryId: string;
  linkId?: string;
  mapName?: string;
  progress?: number;
  notDone?: number;
  notHome?: number;
  assignees?: string[];
  coordinates?: latlongInterface;
  origin?: latlongInterface;
}

export interface SpeedDialAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: string;
  keepOpen?: boolean;
}

export interface SpeedDialProps {
  icon?: React.ReactNode;
  actions: SpeedDialAction[];
  direction?: "up" | "down" | "left" | "right";
  className?: string;
  size?: "sm" | "lg";
  variant?: string;
  keepOpenOnAction?: boolean;
  position?: {
    bottom?: string;
    right?: string;
    top?: string;
    left?: string;
  };
}

// Map listing component interfaces
export interface MapListingProps {
  sortedAddressList: addressDetails[];
  mapViews: Map<string, boolean>;
  setMapViews: React.Dispatch<React.SetStateAction<Map<string, boolean>>>;
  processingMap: { isProcessing: boolean; mapId: string | null };
  policy: Policy;
  userAccessLevel: string;
  setValues: React.Dispatch<React.SetStateAction<object>>;
  toggleAddressTerritoryListing: () => void;
  addFloorToMap: (mapId: string, higherFloor?: boolean) => Promise<void>;
  resetMap: (mapId: string) => Promise<void>;
  deleteMap: (mapId: string, name: string, showAlert: boolean) => Promise<void>;
  values: object;
  accordingKeys: string[];
  setAccordionKeys: React.Dispatch<React.SetStateAction<string[]>>;
  isReadonly: boolean;
}

export interface MapRowProps {
  sortedAddressList: addressDetails[];
  mapViews: Map<string, boolean>;
  processingMap: { isProcessing: boolean; mapId: string | null };
  policy: Policy;
  userAccessLevel: string;
  accordingKeys: string[];
  isReadonly: boolean;
  dropDirections: DropDirections;
  handlers: {
    handleDropdownDirection: (
      event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>,
      dropdownId: string
    ) => void;
    handleToggleMapView: (mapId: string) => void;
    handleShowGetLocation: (addressElement: addressDetails) => void;
    handleShowChangeLocation: (
      mapId: string,
      currentMapName: string,
      coordinates: latlongInterface
    ) => void;
    handleShowChangeMapCode: (mapId: string, mapCode: string) => void;
    handleChangeTerritory: (mapId: string, mapName: string) => void;
    handleShowChangeName: (mapId: string, mapName: string) => void;
    handleShowAddUnit: (mapId: string, addressElement: addressDetails) => void;
    handleAddHigherFloor: (mapId: string) => void;
    handleAddLowerFloor: (mapId: string) => void;
    handleResetMap: (mapId: string, mapName: string) => void;
    handleDeleteMap: (mapId: string, mapName: string) => void;
    handleToggleMapExpansion: (mapId: string) => void;
    handleSequenceUpdate: (mapId: string) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

// Component-specific interfaces

export interface LoaderProps {
  suspended?: boolean;
}

export interface GenericDropdownButtonProps {
  label: React.ReactNode;
  className?: string;
  align?:
    | "start"
    | "end"
    | { sm: "start" | "end" }
    | { md: "start" | "end" }
    | { lg: "start" | "end" }
    | { xl: "start" | "end" }
    | { xxl: "start" | "end" };
  variant?: string;
  size?: "sm" | "lg";
  drop?: DropDirection;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  children: React.ReactNode;
}

export interface GenericDropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
}

export interface GenericButtonProps {
  label: React.ReactNode;
  size?: "sm" | "lg";
  variant?: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  dataAttributes?: Record<string, string>;
}

export interface MapViewProps {
  sortedAddressList: addressDetails[];
  policy: Policy;
}

export interface GmapAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
  origin: string;
}

export interface MissingSetupPageProps {
  message: string;
}

export interface MapControlProps {
  onClick: () => void;
  isLocating?: boolean;
}

export interface ControlPanelProps {
  lat: number;
  lng: number;
  name?: string;
}

export interface TravelModeButtonsProps {
  travelMode: google.maps.TravelMode;
  onTravelModeChange: (travelMode: google.maps.TravelMode) => void;
}

export interface CircularProgressProps {
  size: number;
  progress: number;
  strokeWidth: number;
  highlightColor: string;
  backgroundColor: string;
  hasAssignments: boolean;
  hasPersonal: boolean;
  children?: React.ReactNode;
}

export interface PersonalButtonGroupProps {
  addressElement: addressDetails;
  policy: Policy;
  userId: string;
}

export interface StateMiddlewareProps {
  children: React.ReactElement;
}

export interface MaintenanceMiddlewareProps {
  underMaintenance: boolean;
  children: React.ReactElement;
}

export interface AddressMarkerProps {
  addressElement: addressDetails;
  isSelected: boolean;
  onClick: () => void;
}

export interface MapsMiddlewareProps {
  children: React.ReactElement;
}

export interface MainMiddlewareProps {
  children: React.ReactElement;
}

export interface CombinedMiddlewareProps {
  children: React.ReactElement;
}

// Language-related interfaces

export type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  languageOptions: { value: string; label: string }[];
};

export interface LanguageProviderProps {
  children: React.ReactNode;
}

export interface LanguageListingProps {
  showListing: boolean;
  hideFunction: () => void;
  handleSelect: (language: string) => void;
  currentLanguage: string;
  languageOptions: Array<{ label: string; value: string }>;
}

// Hook interfaces

export interface CongregationManagementOptions {
  userId: string;
}

export interface TerritoryManagementOptions {
  congregationCode: string;
}

// State management interfaces

export interface StateType {
  frontPageMode: "login" | "signup" | "forgot";
  setFrontPageMode: React.Dispatch<
    React.SetStateAction<"login" | "signup" | "forgot">
  >;
}

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  actualTheme: "light" | "dark";
}

export interface MapSequenceUpdateModalProps
  extends mapInterface,
    congregationInterface,
    footerInterface {}

export interface OptionTooltipProps {
  id: string;
  children: React.ReactNode;
  title: string;
}
