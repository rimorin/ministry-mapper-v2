import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { firestore } from "../../firebase";

const deleteTerritory = async (congregation: string, territoryId: string) => {
  const addressRef = query(
    collection(firestore, `congregations/${congregation}/addresses`),
    where("territory", "==", territoryId)
  );

  const addressSnapshot = await getDocs(addressRef);

  for (const address of addressSnapshot.docs) {
    deleteDoc(address.ref);
  }

  const territoryRef = doc(
    collection(firestore, `congregations/${congregation}/territories`),
    territoryId
  );

  deleteDoc(territoryRef);
};

export default deleteTerritory;
