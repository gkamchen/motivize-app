import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import {
    Card,
    Modal,
    Text,
    Button,
} from '@ui-kitten/components';

const ConfirmModal = forwardRef((props, ref) => {
    const [state, setState] = useState({
        visible: false,
        message: '',
    });

    const show = ({
        message,
    }) => {
        setState({
            ...state,
            visible: true,
            message: message,
        });
        setTimeout(hide, 2000);
    };

    const hide = () => {
        setState({
            ...state,
            visible: false,
        });
    };

    const handleOnBackdropPress = () => {
        hide();
    };

    useImperativeHandle(ref, () => ({
        show,
        hide,
    }));

    const styles = StyleSheet.create({
        backdrop: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems:'center',
            justifyContent:'center',
            textAlign:'center',
        },
        buttonView: {
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexDirection: 'row',
            marginTop: 10,
        },
    });

    const {
        visible,
        message,
    } = state;

    return (
        <Modal
            visible={visible}
            backdropStyle={styles.backdrop}
            onBackdropPress={handleOnBackdropPress}
        >
            <Card disabled={true}>
                <Text>{message}</Text>
                <View style={styles.buttonView}>
                </View>
            </Card>
        </Modal>
    );
});

ConfirmModal.displayName = 'ConfirmModal';

export default ConfirmModal;