"use client"
import MainForm from "@/components/form/main-form";
import { closeModalReducer, openAlertReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";
import Footer from "@/template/footer";
import Header from "@/template/header";
import { LogInField } from "@/utils/constants/forms/logIn";
import { useRouter } from "next/navigation";

const Page = () => {
    const navigation = useRouter();
    const dispatch = useAppDispatch();
    return (
        <>
            <Header />
            <section className="p-10 min-h-[80vh] md:w-[60%] mx-auto">
                <label className="text-gray-500 font-medium"></label>
                <MainForm
                    actionType="post-login"
                    dataForm={LogInField()}
                    message_button="Iniciar Sesión"
                    onSuccess={() => {
                        try {
                            dispatch(closeModalReducer({ modalName: "login-modal" }));
                            navigation.push("/reporteria");
                        } catch {
                            dispatch(
                                openAlertReducer({
                                    title: "Correo o contraseña incorrectos!",
                                    message: "Credenciales invalidas",
                                    type: "error",
                                    icon: "alert",
                                    duration: 4000
                                })
                            );
                            navigation.push("/"); // Redirigir a la página de login
                        }
                    }}
                />
            </section>
            <Footer />
        </>
    )
}
export default Page;