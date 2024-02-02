import { unitDetails } from "../interface";

const processAddressData = async (
  congregation: string,
  postal: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
) => {
  const dataList = [];
  for (const floor in data) {
    const unitsDetails: unitDetails[] = [];
    // const addressSnapshot = await pollingQueryFunction(() =>
    //   get(
    //     query(
    //       ref(database, `addresses/${congregation}/${postal}/units/${floor}`),
    //       orderByChild("sequence")
    //     )
    //   )
    // );
    // addressSnapshot.forEach((element: DataSnapshot) => {
    //   const unitValues = element.val();
    //   const unitNumber = element.key || "";
    //   unitsDetails.push({
    //     propertyPostal: unitValues.x_zip,
    //     number: unitNumber,
    //     note: unitValues.note,
    //     type: unitValues.type || "",
    //     status: unitValues.status,
    //     nhcount: unitValues.nhcount || NOT_HOME_STATUS_CODES.DEFAULT,
    //     dnctime: unitValues.dnctime || null,
    //     sequence: unitValues.sequence
    //   });
    // });
    dataList.unshift({ floor: floor, units: unitsDetails });
  }
  return dataList;
};

export default processAddressData;
