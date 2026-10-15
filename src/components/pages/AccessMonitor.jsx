import { useCallback, useEffect, useMemo, useState } from "react";
import AuthButton from "../AuthButton";
import { useAuth } from "../../auth/AuthContext";
import { authConfigured, supabase } from "../../auth/supabase";
import "./AccessMonitor.css";

const CAMPOS = "device_id,first_seen,last_seen,total_entries,total_sessions,active_days,entries_per_active_day,entries_per_session";

function formatarData(valor) {
    if (!valor) return "—";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(data);
}

function formatarNumero(valor, casas = 0) {
    const numero = Number(valor || 0);
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
    }).format(numero);
}

export default function AccessMonitor() {
    const { user, loading: authLoading } = useAuth();
    const [rows, setRows] = useState([]);
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [updatedAt, setUpdatedAt] = useState(null);

    const carregar = useCallback(async () => {
        if (!user || !supabase) return;
        setLoading(true);
        setError("");

        const { data: autorizado, error: erroPermissao } = await supabase.rpc("is_access_monitor_admin");
        if (erroPermissao) {
            setIsAdmin(null);
            setRows([]);
            setError("Não foi possível validar o acesso. Confirme se a migração do painel foi aplicada no Supabase.");
            setLoading(false);
            return;
        }

        setIsAdmin(Boolean(autorizado));
        if (!autorizado) {
            setRows([]);
            setLoading(false);
            return;
        }

        const { data, error: erroConsulta } = await supabase
            .from("access_monitor_summary")
            .select(CAMPOS)
            .order("last_seen", { ascending: false });

        if (erroConsulta) {
            setRows([]);
            setError("A consulta foi bloqueada. Verifique a migração e as permissões do painel no Supabase.");
        } else {
            setRows(data || []);
            setUpdatedAt(new Date());
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const resumo = useMemo(() => {
        const agora = Date.now();
        const seteDias = 7 * 24 * 60 * 60 * 1000;
        return {
            devices: rows.length,
            entries: rows.reduce((total, row) => total + Number(row.total_entries || 0), 0),
            sessions: rows.reduce((total, row) => total + Number(row.total_sessions || 0), 0),
            active: rows.filter((row) => {
                const lastSeen = new Date(row.last_seen).getTime();
                return Number.isFinite(lastSeen) && agora - lastSeen <= seteDias;
            }).length,
        };
    }, [rows]);

    return (
        <div className="access-monitor-page">
            <header className="access-monitor-topbar">
                <a href="/" className="access-monitor-brand">← Riff Theory</a>
                <span>Painel administrativo</span>
            </header>

            <main className="access-monitor-main">
                <p className="access-monitor-eyebrow">MÉTRICAS DE USO · DADOS PSEUDÔNIMOS</p>
                <div className="access-monitor-heading">
                    <div>
                        <h1>Monitor de acessos</h1>
                        <p>Entradas, sessões e frequência por navegador que aceitou o monitoramento.</p>
                    </div>
                    {user && (
                        <button className="access-monitor-refresh" type="button" onClick={carregar} disabled={loading}>
                            {loading ? "Atualizando…" : "Atualizar"}
                        </button>
                    )}
                </div>

                <div className="access-monitor-account"><AuthButton compact redirectTo={window.location.href} /></div>

                {!authLoading && !authConfigured && (
                    <section className="access-monitor-notice" role="status">
                        O login ainda não está configurado neste ambiente. O painel não libera dados sem autenticação.
                    </section>
                )}

                {!authLoading && authConfigured && !user && (
                    <section className="access-monitor-gate">
                        <h2>Acesso restrito</h2>
                        <p>Entre com a conta Google autorizada para consultar as métricas.</p>
                    </section>
                )}

                {user && error && <section className="access-monitor-error" role="alert">{error}</section>}

                {user && isAdmin === false && !loading && (
                    <section className="access-monitor-gate">
                        <h2>Conta sem autorização</h2>
                        <p>Esta conta não está na lista de administradores do monitor. Os dados continuam protegidos pelo Supabase.</p>
                    </section>
                )}

                {user && isAdmin && !error && (
                    <>
                        <section className="access-monitor-metrics" aria-label="Resumo de acessos">
                            <article><span>Navegadores registrados</span><strong>{formatarNumero(resumo.devices)}</strong></article>
                            <article><span>Entradas registradas</span><strong>{formatarNumero(resumo.entries)}</strong></article>
                            <article><span>Sessões</span><strong>{formatarNumero(resumo.sessions)}</strong></article>
                            <article><span>Ativos nos últimos 7 dias</span><strong>{formatarNumero(resumo.active)}</strong></article>
                        </section>

                        <section className="access-monitor-panel">
                            <div className="access-monitor-panel-heading">
                                <div>
                                    <h2>Frequência por navegador</h2>
                                    <p>O identificador é aleatório e local ao navegador; não é um nome nem um IP.</p>
                                </div>
                                <small>{updatedAt ? `Atualizado ${formatarData(updatedAt)}` : ""}</small>
                            </div>

                            {loading && <p className="access-monitor-empty">Carregando métricas…</p>}
                            {!loading && rows.length === 0 && <p className="access-monitor-empty">Ainda não há acessos consentidos registrados.</p>}
                            {!loading && rows.length > 0 && (
                                <div className="access-monitor-table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Dispositivo pseudônimo</th>
                                                <th>Primeiro acesso</th>
                                                <th>Último acesso</th>
                                                <th>Entradas</th>
                                                <th>Sessões</th>
                                                <th>Dias ativos</th>
                                                <th>Entradas/dia ativo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row) => (
                                                <tr key={row.device_id}>
                                                    <td><code>…{String(row.device_id).slice(-8)}</code></td>
                                                    <td>{formatarData(row.first_seen)}</td>
                                                    <td>{formatarData(row.last_seen)}</td>
                                                    <td>{formatarNumero(row.total_entries)}</td>
                                                    <td>{formatarNumero(row.total_sessions)}</td>
                                                    <td>{formatarNumero(row.active_days)}</td>
                                                    <td>{formatarNumero(row.entries_per_active_day, 2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                        <p className="access-monitor-footnote">
                            A contagem depende de consentimento e do armazenamento local. Se alguém apagar os dados do navegador ou trocar de navegador/dispositivo, poderá aparecer como outro identificador. O monitor não tenta identificar pessoas.
                        </p>
                    </>
                )}
            </main>
        </div>
    );
}
