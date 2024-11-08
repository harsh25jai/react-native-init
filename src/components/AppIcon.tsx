import { FC, PropsWithChildren } from 'react';
import { TextProps } from 'react-native';
import { IconProps } from 'react-native-vector-icons/Icon';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome5Pro from 'react-native-vector-icons/FontAwesome5Pro';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesome6Pro from 'react-native-vector-icons/FontAwesome6Pro';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Zocial from 'react-native-vector-icons/Zocial';

interface AppIconParams extends IconProps {
    iconFamily?: "AntDesign" | "Entypo" | "EvilIcons" | "Feather" 
        | "FontAwesome" | "FontAwesome5" | "FontAwesome5Pro" | "FontAwesome6" | "FontAwesome6Pro"
        | "Fontisto" | "Foundation" | "Ionicons" | "MaterialCommunityIcons" | "MaterialIcons" 
        | "Octicons" | "SimpleLineIcons" | "Zocial" | undefined;
    props?: TextProps;
}

const AppIcon: FC<PropsWithChildren<AppIconParams>> = ({ iconFamily, name, size, color, props }) => {

    switch (iconFamily) {
        case "AntDesign":
            return <AntDesign name={name} size={size} color={color}  {...props} />
        case "Entypo":
            return <Entypo name={name} size={size} color={color}  {...props} />
        case "EvilIcons":
            return <EvilIcons name={name} size={size} color={color}  {...props} />
        case "Feather":
            return <Feather name={name} size={size} color={color}  {...props} />
        case "FontAwesome":
            return <FontAwesome name={name} size={size} color={color}  {...props} />
        case "FontAwesome5":
            return <FontAwesome5 name={name} size={size} color={color}  {...props} />
        case "FontAwesome5Pro":
            return <FontAwesome5Pro name={name} size={size} color={color}  {...props} />
        case "FontAwesome6":
            return <FontAwesome6 name={name} size={size} color={color}  {...props} />
        case "FontAwesome6Pro":
            return <FontAwesome6Pro name={name} size={size} color={color}  {...props} />
        case "Fontisto":
            return <Fontisto name={name} size={size} color={color}  {...props} />
        case "Foundation":
            return <Foundation name={name} size={size} color={color}  {...props} />
        case "Ionicons":
            return <Ionicons name={name} size={size} color={color}  {...props} />
        case "MaterialCommunityIcons":
            return <MaterialCommunityIcons name={name} size={size} color={color}  {...props} />
        case "MaterialIcons":
            return <MaterialIcons name={name} size={size} color={color}  {...props} />
        case "Octicons":
            return <Octicons name={name} size={size} color={color}  {...props} />
        case "SimpleLineIcons":
            return <SimpleLineIcons name={name} size={size} color={color}  {...props} />
        case "Zocial":
            return <Zocial name={name} size={size} color={color}  {...props} />
        default:
            return <FontAwesome name={name} size={size} color={color}  {...props} />
    }
}

export default AppIcon;