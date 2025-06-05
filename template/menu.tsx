import MainForm from "@/components/form/main-form";
import { usePostLogutMutation } from "@/hooks/reducers/auth";
import { LogInField } from "@/utils/constants/forms/logIn";
import { navigationAdmin, navigationDefault, navigationUser } from "@/utils/constants/router";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import {
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonAvatar,
    IonModal,
    IonButtons,
} from "@ionic/react";
import { X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const AppMenu = () => {
    // Obtener valores de forma correcta y tipada
    const [LogOutProces] = usePostLogutMutation();

    const userRole = getLocalStorageItem("user-role");
    const userId = getLocalStorageItem("user-id");
    const user = getLocalStorageItem("token");

    const logout = async () => {
        if (!userId) {
            console.error("No user ID found");
            return;
        }

        try {
            await LogOutProces(userId).unwrap(); // ✅ Envía solo el ID
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }
    const [isOpen, setIsOpen] = useState(false);

    const getNavigation = () => {
        if (!userRole) return navigationDefault;
        return userRole === "admin" ? navigationAdmin : navigationUser;
    };

    return (
        <>
            <IonMenu contentId="main-content" side="end" className="">
                <IonHeader className="custom-toolbar">
                    <IonToolbar>
                        {user ? (
                            <div className="p-4 text-center">
                                {/* <IonAvatar className="mx-auto mb-3">
                                    <img
                                        src={user.avatar || "/default-avatar.png"}
                                        alt="Avatar"
                                    />
                                </IonAvatar>
                                <IonTitle>{user.name}</IonTitle> */}
                                <IonButton
                                    expand="block"
                                    fill="solid"
                                    color="light"
                                    onClick={logout}
                                    className="mt-3"
                                >
                                    Cerrar Sesión
                                </IonButton>
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                <IonButton
                                    fill="solid"
                                    color="light"
                                    expand="block"
                                    onClick={() => setIsOpen(true)}
                                    className="font-semibold"
                                >
                                    Iniciar Sesión
                                </IonButton>
                                <IonButton
                                    color="light"
                                    expand="block"
                                    fill="outline"
                                    routerLink="/register"
                                    className="font-semibold"
                                >
                                    Registrarse
                                </IonButton>
                            </div>
                        )}
                    </IonToolbar>
                </IonHeader>

                <IonContent className="bg-white p-2 z-50">
                    <IonList lines="none">
                        {getNavigation().map((item: any) => {
                            const Icon = item.icon;
                            if (!Icon) return
                            return (
                                <IonItem
                                    key={item.href}
                                    routerLink={item.href}
                                    routerDirection="none"
                                    detail={false}
                                    className="rounded-lg p-2"
                                >
                                    <Icon size={20} className="mx-3 text-gray-600" />
                                    <IonLabel className="font-medium">{item.name}</IonLabel>
                                </IonItem>
                            );
                        })}
                    </IonList>

                    {!user && (
                        <div className="p-4 text-sm text-gray-500">
                            <p>
                                ¿Eres proveedor?
                                <Link to="/proveedor-login" className="text-primary-600">
                                    Acceso proveedores
                                </Link>
                            </p>
                        </div>
                    )}
                </IonContent>
                <IonModal
                    isOpen={isOpen}
                    onDidDismiss={() => setIsOpen(false)}
                    className="login-modal"
                    breakpoints={[0.25, 0.5, 0.75]}
                    initialBreakpoint={0.75}
                >
                    <IonHeader className="ion-no-border">
                        <IonToolbar>
                            <IonTitle className="text-lg font-medium font-sans">Iniciar Sesión</IonTitle>
                            <IonButtons slot="end">
                                <IonButton
                                    onClick={() => setIsOpen(false)}
                                    strong
                                >
                                    <X className="text-purple-700" />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding-horizontal">
                        <div className="max-w-sm mx-auto py-4">
                            <MainForm
                                actionType="post-login"
                                dataForm={LogInField()}
                                message_button="Iniciar Sesión"
                                onSuccess={({ data }: any) => {
                                    console.log("Login successful:", data);
                                    setIsOpen(false);
                                }}
                            />
                        </div>
                    </IonContent>
                </IonModal>
            </IonMenu>
        </>
    );
};

export default AppMenu;