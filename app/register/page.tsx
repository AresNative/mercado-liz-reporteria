import MainForm from "@/components/form/main-form";
import Footer from "@/template/footer";
import Header from "@/template/header";

const Page = () => {
    return (
        <>
            <Header />
            <section className="p-10 min-h-[80vh] md:w-[60%] mx-auto">
                <MainForm
                    actionType="post-general"
                    table="usuarios"
                    dataForm={[{
                        id: 0,
                        type: "MAIL",
                        name: "email",
                        label: "Correo",
                        placeholder: "example@mercadosliz.com",
                        require: true,
                    },
                    {
                        id: 1,
                        type: "PASSWORD",
                        name: "password",
                        label: "Contraseña",
                        placeholder: "UseExample@123",
                        require: true,
                    },
                    {
                        id: 2,
                        type: "SELECT",
                        name: "rol",
                        label: "Rol del usuario",
                        options: ["cajero", "ventas", "compras", "almacen", "seguridad", "imagen", "abarrotes", "entregas"],
                        require: true,
                    },]}
                    message_button="Registrar"
                />
            </section>
            <Footer />
        </>
    )
}
export default Page;