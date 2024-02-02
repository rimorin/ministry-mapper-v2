import { addDoc, collection } from "firebase/firestore";
import { firestore } from "../../firebase";

const setNotification = async (
  type: number,
  congregation: string,
  mapId: string,
  fromUser: string
) => {
  await addDoc(collection(firestore, "notifications"), {
    congregation: congregation,
    type: type,
    map: mapId,
    fromUser: fromUser
  });
};

export default setNotification;
