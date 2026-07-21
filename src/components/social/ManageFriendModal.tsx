import { StyleSheet, Text, View } from "react-native";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { useAcceptFriendRequest } from "../../hooks/friendships/useAcceptFriendRequest";
import { useBlockUser } from "../../hooks/blocks/useBlockUser";
import { useRemoveFriendship } from "../../hooks/friendships/useRemoveFriendship";
import { useSendFriendRequest } from "../../hooks/friendships/useSendFriendRequest";
import { useUnblockUser } from "../../hooks/blocks/useUnblockUser";
import type { ProfileRow, RelationshipStatus } from "../../types";
import { manageFriendModalColors } from "./manageFriendModalColors";

interface ManageFriendModalProps {
  visible: boolean;
  onClose: () => void;
  profile: ProfileRow | null;
  relationship: RelationshipStatus;
  myProfileId: string;
}

/**
 * Renders the action set for whatever `relationship` the target profile
 * currently has to the signed-in user -- the same branching logic applies
 * whether the row came from a tab or from a global user search.
 */
export function ManageFriendModal({ visible, onClose, profile, relationship, myProfileId }: ManageFriendModalProps) {
  const sendRequest = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriendship();
  const block = useBlockUser();
  const unblock = useUnblockUser();

  const isPending = sendRequest.isPending || accept.isPending || remove.isPending || block.isPending || unblock.isPending;
  const error = sendRequest.error ?? accept.error ?? remove.error ?? block.error ?? unblock.error;

  const handleBlock = () => {
    if (!profile) return;
    block.mutate({ blockerId: myProfileId, blockedId: profile.id }, { onSuccess: onClose });
  };

  return (
    <Modal visible={visible} onClose={onClose} title={profile?.username ?? ""}>
      {profile && (
        <View style={styles.content}>
          {relationship.type === "friend" && (
            <>
              <Button
                label="Remove Friend"
                variant="danger"
                loading={remove.isPending}
                disabled={isPending}
                onPress={() => remove.mutate(relationship.friendshipId, { onSuccess: onClose })}
              />
              <Button label="Block" variant="danger" loading={block.isPending} disabled={isPending} onPress={handleBlock} />
            </>
          )}

          {relationship.type === "incomingPending" && (
            <>
              <Button
                label="Accept"
                variant="primary"
                loading={accept.isPending}
                disabled={isPending}
                onPress={() => accept.mutate(relationship.friendshipId, { onSuccess: onClose })}
              />
              <Button
                label="Decline"
                variant="secondary"
                loading={remove.isPending}
                disabled={isPending}
                onPress={() => remove.mutate(relationship.friendshipId, { onSuccess: onClose })}
              />
              <Button label="Block" variant="danger" loading={block.isPending} disabled={isPending} onPress={handleBlock} />
            </>
          )}

          {relationship.type === "outgoingPending" && (
            <>
              <Button
                label="Cancel Request"
                variant="secondary"
                loading={remove.isPending}
                disabled={isPending}
                onPress={() => remove.mutate(relationship.friendshipId, { onSuccess: onClose })}
              />
              <Button label="Block" variant="danger" loading={block.isPending} disabled={isPending} onPress={handleBlock} />
            </>
          )}

          {relationship.type === "blocked" && (
            <Button
              label="Unblock"
              variant="secondary"
              loading={unblock.isPending}
              disabled={isPending}
              onPress={() => unblock.mutate(relationship.blockId, { onSuccess: onClose })}
            />
          )}

          {relationship.type === "none" && (
            <>
              <Button
                label="Send Friend Request"
                variant="primary"
                loading={sendRequest.isPending}
                disabled={isPending}
                onPress={() => sendRequest.mutate({ requesterId: myProfileId, addresseeId: profile.id }, { onSuccess: onClose })}
              />
              <Button label="Block" variant="danger" loading={block.isPending} disabled={isPending} onPress={handleBlock} />
            </>
          )}

          {error && <Text style={styles.error}>{error.message}</Text>}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  error: { color: manageFriendModalColors.error },
});
