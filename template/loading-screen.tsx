import { IonPage, IonContent, IonSpinner } from "@ionic/react";

export const LoadingScreen = () => (
    <IonPage>
        <IonContent className="ion-padding" fullscreen>
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <IonSpinner
                        name="crescent"
                        className="h-12 w-12 text-purple-600"
                    />
                    <p className="mt-4 text-gray-600">Cargando pantalla...</p>
                </div>
            </div>
        </IonContent>
    </IonPage>
);